#!/usr/bin/env node
/**
 * HTTP test API for the Bobu website.
 *
 *   node harness/server.mjs            # listens on :7331
 *   PORT=8080 node harness/server.mjs
 *
 * Endpoints
 *   GET  /health                        liveness + browser state
 *   GET  /api/catalog                   every page, game and feature, with its endpoint
 *   GET  /api/pages                     list pages
 *   GET  /api/pages/:id                 check one page
 *   POST /api/pages/check               check all pages
 *   GET  /api/games                     list games
 *   GET  /api/games/:id                 check one game
 *   GET  /api/games/:id/state           load the game and return getState()
 *   POST /api/games/:id/drive           { seed, inputs: [...], ticks } -> resulting state
 *   POST /api/games/:id/selftest        run the game's in-bundle rules selftest
 *   POST /api/games/check               check all games
 *   GET  /api/features                  list BobuOS features
 *   GET  /api/features/:id              check one feature
 *   POST /api/features/check            check all features
 *   POST /api/check-all                 full sweep, returns the aggregate report
 *   GET  /api/screenshots/:name         PNG produced by the last check
 *
 * Every check response has the shape
 *   { id, kind, ok, checks: [{name, ok, detail}], consoleErrors, failedRequests, screenshot, ms }
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SiteHarness } from "./api.mjs";
import { CATALOG, findGame } from "./registry.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 7331);

const site = await SiteHarness.launch();

const json = (res, code, body) => {
  const text = JSON.stringify(body, null, 2);
  res.writeHead(code, { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" });
  res.end(text);
};

const readBody = (req) =>
  new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); }
    });
  });

/** Loads a game and runs a seeded input/tick script against window.__GAME__. */
async function driveGame(id, { seed = 1, inputs = [], ticks = 0 } = {}) {
  const spec = findGame(id);
  if (!spec) return { ok: false, error: `unknown game '${id}'` };
  if (spec.kind !== "js") return { ok: false, error: `game '${id}' is a ${spec.kind} batch run and cannot be driven` };

  const { context, page } = await site.openGame(id);
  try {
    await page.waitForFunction(() => window.__GAME__?.ready === true, null, { timeout: 20000 });
    const result = await page.evaluate(
      ({ seed, inputs, ticks }) => {
        const g = window.__GAME__;
        g.reset(seed);
        const log = [];
        for (const step of inputs) {
          const action = typeof step === "string" ? step : step.action;
          const payload = typeof step === "string" ? undefined : step.payload;
          let out;
          try { out = g.input(action, payload); } catch (e) { out = { ok: false, reason: `threw: ${String(e)}` }; }
          log.push({ action, payload: payload ?? null, result: out ?? null });
        }
        if (ticks > 0) g.step(ticks);
        return { inputs: log, state: g.getState(), actions: g.actions() };
      },
      { seed, inputs, ticks },
    );
    return { ok: true, id, seed, ticks, ...result };
  } catch (e) {
    return { ok: false, id, error: String(e) };
  } finally {
    await context.close();
  }
}

async function selftestGame(id) {
  const spec = findGame(id);
  if (!spec) return { ok: false, error: `unknown game '${id}'` };
  if (spec.kind !== "js") return { ok: false, error: `game '${id}' has no in-bundle selftest` };
  const { context, page } = await site.openGame(id);
  try {
    await page.waitForFunction(() => window.__GAME__?.ready === true, null, { timeout: 20000 });
    const out = await page.evaluate(() => {
      const g = window.__GAME__;
      if (!g.actions().includes("selftest")) return { supported: false };
      try { return { supported: true, report: g.input("selftest") }; }
      catch (e) { return { supported: true, threw: String(e) }; }
    });
    return { ok: !out.threw && out.supported !== false, id, ...out };
  } finally {
    await context.close();
  }
}

const ROUTES = [
  ["GET", /^\/health$/, async () => ({ status: 200, body: { ok: true, baseUrl: site.baseUrl, uptime: process.uptime() } })],

  ["GET", /^\/api\/catalog$/, async () => ({
    status: 200,
    body: {
      pages: CATALOG.pages.map((p) => ({ ...p, endpoint: `/api/pages/${p.id}` })),
      games: CATALOG.games.map((g) => ({
        ...g,
        endpoints: {
          check: `/api/games/${g.id}`,
          state: `/api/games/${g.id}/state`,
          drive: `/api/games/${g.id}/drive`,
          selftest: `/api/games/${g.id}/selftest`,
        },
      })),
      features: CATALOG.features.map((f) => ({ ...f, endpoint: `/api/features/${f.id}` })),
    },
  })],

  ["GET", /^\/api\/pages$/, async () => ({ status: 200, body: CATALOG.pages })],
  ["POST", /^\/api\/pages\/check$/, async () => ({ status: 200, body: await site.checkAllPages() })],
  ["GET", /^\/api\/pages\/([\w-]+)$/, async (m) => {
    const r = await site.checkPage(m[1]);
    return { status: r.ok ? 200 : 422, body: r };
  }],

  ["GET", /^\/api\/games$/, async () => ({ status: 200, body: CATALOG.games })],
  ["POST", /^\/api\/games\/check$/, async () => ({ status: 200, body: await site.checkAllGames() })],
  ["GET", /^\/api\/games\/([\w-]+)\/state$/, async (m) => {
    const r = await driveGame(m[1], { seed: 1 });
    return { status: r.ok ? 200 : 422, body: r };
  }],
  ["POST", /^\/api\/games\/([\w-]+)\/drive$/, async (m, body) => {
    const r = await driveGame(m[1], body);
    return { status: r.ok ? 200 : 422, body: r };
  }],
  ["POST", /^\/api\/games\/([\w-]+)\/selftest$/, async (m) => {
    const r = await selftestGame(m[1]);
    return { status: r.ok ? 200 : 422, body: r };
  }],
  ["GET", /^\/api\/games\/([\w-]+)$/, async (m) => {
    const r = await site.checkGame(m[1]);
    return { status: r.ok ? 200 : 422, body: r };
  }],

  ["GET", /^\/api\/features$/, async () => ({ status: 200, body: CATALOG.features })],
  ["POST", /^\/api\/features\/check$/, async () => ({ status: 200, body: await site.checkAllFeatures() })],
  ["GET", /^\/api\/features\/([\w-]+)$/, async (m) => {
    const r = await site.checkFeature(m[1]);
    return { status: r.ok ? 200 : 422, body: r };
  }],

  ["POST", /^\/api\/check-all$/, async () => {
    const r = await site.checkAll();
    return { status: r.ok ? 200 : 422, body: r };
  }],
];

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const pathname = url.pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
    });
    return res.end();
  }

  // Screenshots produced by the checks.
  const shot = pathname.match(/^\/api\/screenshots\/([\w.-]+)$/);
  if (shot && req.method === "GET") {
    const file = path.join(site.screenshotDir, shot[1].endsWith(".png") ? shot[1] : `${shot[1]}.png`);
    if (!file.startsWith(site.screenshotDir) || !fs.existsSync(file)) return json(res, 404, { ok: false, error: "no such screenshot" });
    res.writeHead(200, { "content-type": "image/png", "access-control-allow-origin": "*" });
    return fs.createReadStream(file).pipe(res);
  }

  for (const [method, re, handler] of ROUTES) {
    if (req.method !== method) continue;
    const m = pathname.match(re);
    if (!m) continue;
    try {
      const body = method === "POST" ? await readBody(req) : {};
      const { status, body: out } = await handler(m, body);
      return json(res, status, out);
    } catch (e) {
      return json(res, 500, { ok: false, error: String(e?.stack ?? e) });
    }
  }

  json(res, 404, { ok: false, error: `no route for ${req.method} ${pathname}`, hint: "GET /api/catalog" });
});

server.listen(PORT, () => {
  console.log(`bobu test API listening on http://127.0.0.1:${PORT}`);
  console.log(`site under test served from ${site.baseUrl}`);
  console.log(`try: curl http://127.0.0.1:${PORT}/api/catalog`);
});

const shutdown = async () => {
  server.close();
  await site.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
