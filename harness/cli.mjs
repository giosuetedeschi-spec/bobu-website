#!/usr/bin/env node
/**
 * Headless site checker.
 *
 *   node harness/cli.mjs                 # everything
 *   node harness/cli.mjs pages
 *   node harness/cli.mjs games
 *   node harness/cli.mjs features
 *   node harness/cli.mjs game snake
 *   node harness/cli.mjs page portfolio
 *   node harness/cli.mjs feature terminal
 *   node harness/cli.mjs --json          # machine-readable report on stdout
 *   node harness/cli.mjs --no-screenshots
 *
 * Exits non-zero when any check fails.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SiteHarness } from "./api.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const args = argv.filter((a) => !a.startsWith("--"));
const json = flags.has("--json");
const screenshot = !flags.has("--no-screenshots");

const C = {
  reset: "\x1b[0m", dim: "\x1b[2m", bold: "\x1b[1m",
  green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m", cyan: "\x1b[36m",
};
const plain = json || !process.stdout.isTTY;
const c = (code, s) => (plain ? s : `${code}${s}${C.reset}`);

function printResult(r) {
  const badge = r.ok ? c(C.green, "PASS") : c(C.red, "FAIL");
  console.log(`${badge} ${c(C.bold, r.id)} ${c(C.dim, `(${r.kind ?? "?"}, ${r.ms ?? "?"}ms)`)}`);
  if (r.error) console.log(`      ${c(C.red, "error:")} ${r.error}`);
  for (const ck of r.checks ?? []) {
    if (ck.ok && !flags.has("--verbose")) continue;
    const mark = ck.ok ? c(C.green, "✓") : c(C.red, "✗");
    console.log(`      ${mark} ${ck.name}${ck.detail ? c(C.dim, ` — ${ck.detail}`) : ""}`);
  }
  for (const e of (r.consoleErrors ?? []).slice(0, 5)) console.log(`      ${c(C.yellow, "console:")} ${e}`);
  for (const e of (r.failedRequests ?? []).slice(0, 5)) console.log(`      ${c(C.yellow, "request:")} ${e}`);
}

const site = await SiteHarness.launch();
let results = [];
let report = null;

try {
  const [kind, id] = args;
  if (!kind || kind === "all") {
    report = await site.checkAll({ screenshot });
    results = [...report.pages, ...report.games, ...report.features];
  } else if (kind === "pages") {
    results = await site.checkAllPages({ screenshot });
  } else if (kind === "games") {
    results = await site.checkAllGames({ screenshot });
  } else if (kind === "features") {
    results = await site.checkAllFeatures({ screenshot });
  } else if (kind === "page") {
    results = [await site.checkPage(id, { screenshot })];
  } else if (kind === "game") {
    results = [await site.checkGame(id, { screenshot })];
  } else if (kind === "feature") {
    results = [await site.checkFeature(id, { screenshot })];
  } else if (kind === "catalog") {
    console.log(JSON.stringify(site.catalog(), null, 2));
    await site.close();
    process.exit(0);
  } else {
    console.error(`unknown command '${kind}'`);
    await site.close();
    process.exit(2);
  }
} finally {
  await site.close();
}

const failed = results.filter((r) => !r.ok);
const payload = report ?? {
  ok: failed.length === 0,
  summary: { total: results.length, passed: results.length - failed.length, failed: failed.length },
  results,
};

const reportPath = path.join(HERE, "reports", "last-run.json");
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(payload, null, 2));

if (json) {
  console.log(JSON.stringify(payload, null, 2));
} else {
  for (const r of results) printResult(r);
  const { total, passed, failed: nf } = payload.summary;
  console.log();
  console.log(
    nf === 0
      ? c(C.green, `${C.bold}✓ all ${total} checks passed`)
      : c(C.red, `${C.bold}✗ ${nf} of ${total} failed`) + c(C.dim, ` (${passed} passed)`),
  );
  console.log(c(C.dim, `report: ${path.relative(process.cwd(), reportPath)}`));
}

process.exit(failed.length === 0 ? 0 : 1);
