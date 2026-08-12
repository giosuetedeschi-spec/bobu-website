/**
 * Standalone game checker — serves `public/` directly (no Next build needed)
 * and drives one game bundle through the window.__GAME__ contract.
 *
 *   node harness/quickcheck.mjs /games/snake/index.html
 *   node harness/quickcheck.mjs /games/snake/index.html --shot /tmp/snake.png
 *
 * Exits non-zero if the contract is not satisfied. Intended for iterating on a
 * single game; `harness/cli.mjs` is the full-site runner.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startStaticServer } from "./server-static.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const target = process.argv[2];
if (!target) {
  console.error("usage: node harness/quickcheck.mjs <path-under-public> [--shot out.png] [--ticks N]");
  process.exit(2);
}
const shotIdx = process.argv.indexOf("--shot");
const shot = shotIdx > -1 ? process.argv[shotIdx + 1] : null;
const tickIdx = process.argv.indexOf("--ticks");
const ticks = tickIdx > -1 ? Number(process.argv[tickIdx + 1]) : 30;
// --play N drives the game N ticks right before the screenshot, so the shot
// shows a game in progress rather than its opening frame.
const playIdx = process.argv.indexOf("--play");
const play = playIdx > -1 ? Number(process.argv[playIdx + 1]) : 0;
// --script "<js>" runs arbitrary code in the page just before the screenshot,
// for driving a game into a specific situation worth looking at.
const scriptIdx = process.argv.indexOf("--script");
const script = scriptIdx > -1 ? process.argv[scriptIdx + 1] : null;

const server = await startStaticServer({ dir: path.join(ROOT, "public") });
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });

const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("response", (r) => r.status() >= 400 && errors.push(`${r.url()} -> HTTP ${r.status()}`));
page.on("requestfailed", (r) => errors.push(`${r.url()} FAILED ${r.failure()?.errorText}`));

const results = [];
const check = (name, ok, detail) => results.push({ name, ok, detail });

await page.goto(`${server.url}${target}`, { waitUntil: "networkidle" });

const ready = await page
  .waitForFunction(() => window.__GAME__?.ready === true, null, { timeout: 15000 })
  .then(() => true)
  .catch(() => false);
check("window.__GAME__ ready", ready);

if (ready) {
  const contract = await page.evaluate(() => {
    const g = window.__GAME__;
    return ["getState", "reset", "step", "input", "actions"].map((k) => [k, typeof g[k] === "function"]);
  });
  for (const [k, ok] of contract) check(`implements ${k}()`, ok);

  const state = await page.evaluate(() => {
    const g = window.__GAME__;
    g.reset(99);
    return g.getState();
  });
  check("getState() returns an object", state && typeof state === "object");
  check("state.status present", typeof state?.status === "string", state?.status);
  check("state.score present", state?.score !== undefined, JSON.stringify(state?.score));

  const deterministic = await page.evaluate((n) => {
    const g = window.__GAME__;
    g.reset(4242); g.step(n); const a = JSON.stringify(g.getState());
    g.reset(4242); g.step(n); const b = JSON.stringify(g.getState());
    return a === b;
  }, ticks);
  check(`reset(seed)+step(${ticks}) deterministic`, deterministic);

  const rejects = await page.evaluate(() => {
    const g = window.__GAME__;
    g.reset(1);
    try { return g.input("__nope__", {})?.ok === false; } catch { return false; }
  });
  check("illegal input rejected without throwing", rejects);

  const acts = await page.evaluate(() => window.__GAME__.actions());
  check("actions() non-empty", Array.isArray(acts) && acts.length > 0, JSON.stringify(acts));

  const painted = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    if (!c) return "no-canvas";
    const ctx = c.getContext("2d");
    if (!ctx) return "no-2d-context";
    const { data } = ctx.getImageData(0, 0, Math.min(c.width, 300), Math.min(c.height, 300));
    let n = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n++;
    return n > 100;
  });
  if (painted !== "no-canvas") check("canvas paints pixels", painted === true, String(painted));
}

if (play > 0) {
  await page.evaluate((n) => { window.__GAME__?.reset(7); window.__GAME__?.step(n); }, play);
  await page.waitForTimeout(120); // let one animation frame paint the new state
}
if (script) {
  await page.evaluate(`(() => { ${script} })()`);
  await page.waitForTimeout(120);
}
if (shot) await page.screenshot({ path: shot });

check("no console errors / failed requests", errors.length === 0, errors.slice(0, 8).join(" | "));

await browser.close();
await server.close();

let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  — ${r.detail}` : ""}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed === 0 ? 0 : 1);
