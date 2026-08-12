/**
 * Runs one game bundle's in-bundle rules selftest and prints its report.
 *
 *   node harness/selftest.mjs /games/abalone/index.html
 *
 * Exits non-zero if the selftest is missing or reports failures.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startStaticServer } from "./server-static.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = process.argv[2];
if (!target) {
  console.error("usage: node harness/selftest.mjs <path-under-public>");
  process.exit(2);
}

const server = await startStaticServer({ dir: path.join(ROOT, "public") });
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 850 } });
await page.goto(`${server.url}${target}`, { waitUntil: "networkidle" });
await page.waitForFunction(() => window.__GAME__?.ready === true, null, { timeout: 20000 });

const report = await page.evaluate(() => {
  const g = window.__GAME__;
  if (!g.actions().includes("selftest")) return { missing: true };
  try { return g.input("selftest"); } catch (e) { return { threw: String(e) }; }
});

await browser.close();
await server.close();

if (report.missing) {
  console.log("no selftest exposed by this bundle");
  process.exit(1);
}
const failed = report.failed ?? (report.failures?.length ?? (report.ok === true ? 0 : null));
console.log(JSON.stringify(report, null, 1).slice(0, 4000));
process.exit(failed === 0 ? 0 : 1);
