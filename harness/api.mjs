/**
 * Headless test API for the Bobu website.
 *
 *   import { SiteHarness } from "./harness/api.mjs";
 *   const site = await SiteHarness.launch();
 *   await site.checkGame("snake");
 *   await site.close();
 *
 * Everything is driven through Playwright against the real static export in
 * `out/`, so what the harness exercises is exactly what gets deployed.
 */
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startStaticServer } from "./server-static.mjs";
import { CATALOG, PAGES, GAMES, FEATURES, findGame, findPage, findFeature } from "./registry.mjs";
import { PROBES } from "./probes/index.mjs";
import { FEATURE_CHECKS } from "./features.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

/** Console noise that is never a real defect. */
const IGNORED_CONSOLE = [
  /favicon/i,
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /Cross-Origin-Embedder-Policy/i,
];

const IGNORED_REQUESTS = [
  /favicon\.ico$/i,
  // Next prefetches every visible <Link>; those in-flight requests are aborted
  // when the harness closes the page, which is not a site defect.
  /net::ERR_ABORTED/i,
];

/**
 * Pyodide is fetched from a CDN at runtime. On a sandboxed runner with no
 * egress that request fails, and the failed <Script> then trips React's
 * hydration warning. Neither says anything about the game, so for pyodide
 * bundles specifically those two are tolerated -- everything else still counts.
 */
const PYODIDE_TOLERATED = [/cdn\.jsdelivr\.net/i, /Minified React error #418/i, /ERR_TUNNEL_CONNECTION_FAILED/i];

export class SiteHarness {
  constructor({ browser, server, screenshotDir }) {
    this.browser = browser;
    this.server = server;
    this.baseUrl = server.url;
    this.screenshotDir = screenshotDir;
  }

  static async launch({ port = 0, headless = true, screenshotDir = path.join(HERE, "reports", "screenshots"), outDir = path.join(ROOT, "out") } = {}) {
    if (!fs.existsSync(outDir)) {
      throw new Error(`Static export not found at ${outDir}. Run \`npm run build\` first.`);
    }
    fs.mkdirSync(screenshotDir, { recursive: true });
    const server = await startStaticServer({ dir: outDir, port });
    const browser = await chromium.launch({
      headless,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
    return new SiteHarness({ browser, server, screenshotDir });
  }

  async close() {
    await this.browser?.close();
    await this.server?.close();
  }

  /** Opens a page with console/network error collection wired up. */
  async _open(route, { viewport = { width: 1440, height: 900 } } = {}) {
    const context = await this.browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const errors = [];
    const failedRequests = [];

    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      if (IGNORED_CONSOLE.some((re) => re.test(text))) return;
      errors.push(text);
    });
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
    page.on("requestfailed", (req) => {
      const reason = req.failure()?.errorText ?? "";
      // Next prefetches every visible <Link>; those in-flight requests abort
      // when the harness closes the page, which is not a site defect.
      if (reason.includes("ERR_ABORTED")) return;
      if (IGNORED_REQUESTS.some((re) => re.test(req.url()))) return;
      failedRequests.push(`${req.url()} (${reason})`);
    });
    page.on("response", (res) => {
      if (res.status() < 400) return;
      if (IGNORED_REQUESTS.some((re) => re.test(res.url()))) return;
      failedRequests.push(`${res.url()} -> HTTP ${res.status()}`);
    });

    await page.goto(`${this.baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    return { context, page, errors, failedRequests };
  }

  async _shot(page, name) {
    const file = path.join(this.screenshotDir, `${name}.png`);
    await page.screenshot({ path: file, fullPage: false }).catch(() => {});
    return path.relative(ROOT, file);
  }

  // ---------------------------------------------------------------- catalog

  catalog() {
    return CATALOG;
  }

  // ------------------------------------------------------------------ pages

  async checkPage(id, { screenshot = true } = {}) {
    const spec = findPage(id);
    if (!spec) return { id, ok: false, error: `unknown page '${id}'` };
    const started = Date.now();
    let { context, page, errors, failedRequests } = await this._open(spec.route);
    const checks = [];

    try {
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

      if (spec.expect?.selector) {
        const found = await page.locator(spec.expect.selector).first().count();
        checks.push({ name: `selector ${spec.expect.selector}`, ok: found > 0 });
      }
      if (spec.expect?.text) {
        const found = await page.getByText(spec.expect.text, { exact: false }).first().count();
        checks.push({ name: `text "${spec.expect.text}"`, ok: found > 0 });
      }
      if (spec.expect?.anyOf) {
        let hit = null;
        for (const sel of spec.expect.anyOf) {
          if ((await page.locator(sel).count()) > 0) { hit = sel; break; }
        }
        checks.push({ name: `anyOf ${spec.expect.anyOf.join(" | ")}`, ok: !!hit, detail: hit });
      }

      // Every page must render something and must not be an error boundary.
      // A game page is mostly one iframe, so its own text is only a title and
      // a tag -- an embedded frame counts as content just as much as prose.
      const bodyText = (await page.locator("body").innerText().catch(() => "")) || "";
      const embeds = await page.locator("iframe, canvas").count();
      checks.push({
        name: "page rendered content",
        ok: bodyText.trim().length > 20 || (embeds > 0 && bodyText.trim().length > 0),
        detail: `${bodyText.trim().length} chars, ${embeds} embeds`,
      });
      checks.push({
        name: "no Next.js error overlay",
        ok: !/Application error: a client-side exception|Unhandled Runtime Error/i.test(bodyText),
      });

      const screenshotPath = screenshot ? await this._shot(page, `page-${id}`) : null;
      const tolerate = (list) =>
        spec.needsNetwork ? list.filter((e) => !PYODIDE_TOLERATED.some((re) => re.test(e))) : list;
      errors = tolerate(errors);
      failedRequests = tolerate(failedRequests);
      const ok = checks.every((c) => c.ok) && errors.length === 0 && failedRequests.length === 0;
      return { id, kind: "page", route: spec.route, ok, checks, consoleErrors: errors, failedRequests, screenshot: screenshotPath, ms: Date.now() - started };
    } catch (err) {
      return { id, kind: "page", route: spec.route, ok: false, error: String(err), checks, consoleErrors: errors, failedRequests, ms: Date.now() - started };
    } finally {
      await context.close();
    }
  }

  async checkAllPages(opts) {
    const out = [];
    for (const p of PAGES) out.push(await this.checkPage(p.id, opts));
    return out;
  }

  // ------------------------------------------------------------------ games

  /** Loads a game bundle and waits for the `window.__GAME__` contract. */
  async openGame(id, { viewport = { width: 1100, height: 800 } } = {}) {
    const spec = findGame(id);
    if (!spec) throw new Error(`unknown game '${id}'`);
    const session = await this._open(spec.url, { viewport });
    return { spec, ...session };
  }

  async checkGame(id, { screenshot = true } = {}) {
    const spec = findGame(id);
    if (!spec) return { id, ok: false, error: `unknown game '${id}'` };
    const started = Date.now();
    const { context, page, errors, failedRequests } = await this._open(spec.url);
    const checks = [];

    try {
      await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});

      if (spec.kind === "js") {
        const ready = await page
          .waitForFunction(() => window.__GAME__ && window.__GAME__.ready === true, null, { timeout: 15000 })
          .then(() => true)
          .catch(() => false);
        checks.push({ name: "window.__GAME__ ready", ok: ready });

        if (ready) {
          const contract = await page.evaluate(() => {
            const g = window.__GAME__;
            return {
              id: g.id,
              hasGetState: typeof g.getState === "function",
              hasReset: typeof g.reset === "function",
              hasStep: typeof g.step === "function",
              hasInput: typeof g.input === "function",
              hasActions: typeof g.actions === "function",
            };
          });
          checks.push({ name: "id matches registry", ok: contract.id === spec.id, detail: contract.id });
          for (const [k, label] of [["hasGetState", "getState()"], ["hasReset", "reset()"], ["hasStep", "step()"], ["hasInput", "input()"], ["hasActions", "actions()"]]) {
            checks.push({ name: `implements ${label}`, ok: contract[k] });
          }

          // Determinism: same seed + same tick count => identical state.
          const deterministic = await page.evaluate(() => {
            const g = window.__GAME__;
            const snap = () => JSON.stringify(g.getState());
            g.reset(1234); g.step(10); const a = snap();
            g.reset(1234); g.step(10); const b = snap();
            return a === b;
          }).catch((e) => ({ error: String(e) }));
          checks.push({ name: "reset(seed) is deterministic", ok: deterministic === true, detail: deterministic === true ? null : String(deterministic) });

          // Illegal input must be rejected, not thrown.
          const rejects = await page.evaluate(() => {
            const g = window.__GAME__;
            g.reset(1);
            try {
              const r = g.input("__definitely_not_an_action__", {});
              return r && r.ok === false;
            } catch {
              return false;
            }
          }).catch(() => false);
          checks.push({ name: "unknown input rejected without throwing", ok: rejects });

          const probe = PROBES[spec.probe];
          if (probe) {
            const result = await probe(page).catch((e) => ({ ok: false, checks: [{ name: "probe crashed", ok: false, detail: String(e) }] }));
            checks.push(...(result.checks ?? []));
          } else {
            checks.push({ name: `probe '${spec.probe}' registered`, ok: false });
          }
        }
      } else if (spec.kind === "pyodide") {
        const probe = PROBES.pyodide;
        const result = await probe(page, spec).catch((e) => ({ checks: [{ name: "probe crashed", ok: false, detail: String(e) }] }));
        checks.push(...(result.checks ?? []));
      }

      // A canvas/board game should actually paint something.
      const painted = await page.evaluate(() => {
        const c = document.querySelector("canvas");
        if (!c) return null;
        try {
          const ctx = c.getContext("2d");
          if (!ctx) return null;
          const { data } = ctx.getImageData(0, 0, Math.min(c.width, 200), Math.min(c.height, 200));
          let nonBlank = 0;
          for (let i = 3; i < data.length; i += 4) if (data[i] > 0) nonBlank++;
          return nonBlank > 100;
        } catch { return null; }
      }).catch(() => null);
      if (painted !== null) checks.push({ name: "canvas paints pixels", ok: painted });

      const screenshotPath = screenshot ? await this._shot(page, `game-${id}`) : null;
      const tolerate = (list) =>
        spec.kind === "pyodide" ? list.filter((e) => !PYODIDE_TOLERATED.some((re) => re.test(e))) : list;
      const realErrors = tolerate(errors);
      const realFailures = tolerate(failedRequests);
      const ok = checks.every((c) => c.ok) && realErrors.length === 0 && realFailures.length === 0;
      return { id, kind: "game", url: spec.url, ok, checks, consoleErrors: realErrors, failedRequests: realFailures, screenshot: screenshotPath, ms: Date.now() - started };
    } catch (err) {
      return { id, kind: "game", url: spec.url, ok: false, error: String(err), checks, consoleErrors: errors, failedRequests, ms: Date.now() - started };
    } finally {
      await context.close();
    }
  }

  async checkAllGames(opts) {
    const out = [];
    for (const g of GAMES) out.push(await this.checkGame(g.id, opts));
    return out;
  }

  /** Escape hatch: run arbitrary code against a loaded game's __GAME__ object. */
  async driveGame(id, fn, { viewport } = {}) {
    const { context, page } = await this.openGame(id, { viewport });
    try {
      await page.waitForFunction(() => window.__GAME__?.ready === true, null, { timeout: 15000 });
      return await page.evaluate(fn);
    } finally {
      await context.close();
    }
  }

  // --------------------------------------------------------------- features

  async checkFeature(id, { screenshot = true } = {}) {
    const spec = findFeature(id);
    if (!spec) return { id, ok: false, error: `unknown feature '${id}'` };
    const check = FEATURE_CHECKS[id];
    if (!check) return { id, kind: "feature", ok: false, error: `no implementation for feature '${id}'` };

    const started = Date.now();
    const viewport = id === "mobile-card" ? { width: 390, height: 844 } : { width: 1440, height: 900 };
    const { context, page, errors, failedRequests } = await this._open("/", { viewport });
    let checks = [];
    try {
      const result = await check(page);
      checks = result.checks ?? [];
      const screenshotPath = screenshot ? await this._shot(page, `feature-${id}`) : null;
      const ok = checks.every((c) => c.ok) && errors.length === 0;
      return { id, kind: "feature", name: spec.name, ok, checks, consoleErrors: errors, failedRequests, screenshot: screenshotPath, ms: Date.now() - started };
    } catch (err) {
      return { id, kind: "feature", name: spec.name, ok: false, error: String(err), checks, consoleErrors: errors, ms: Date.now() - started };
    } finally {
      await context.close();
    }
  }

  async checkAllFeatures(opts) {
    const out = [];
    for (const f of FEATURES) out.push(await this.checkFeature(f.id, opts));
    return out;
  }

  // ------------------------------------------------------------------- all

  async checkAll(opts) {
    const pages = await this.checkAllPages(opts);
    const games = await this.checkAllGames(opts);
    const features = await this.checkAllFeatures(opts);
    const all = [...pages, ...games, ...features];
    return {
      ok: all.every((r) => r.ok),
      summary: {
        total: all.length,
        passed: all.filter((r) => r.ok).length,
        failed: all.filter((r) => !r.ok).length,
      },
      pages,
      games,
      features,
    };
  }
}
