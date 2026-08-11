/**
 * Evaluates an arbitrary expression inside a loaded game bundle.
 *
 *   node harness/eval.mjs /games/abalone/index.html "window.__GAME__.getState().status"
 *   node harness/eval.mjs /games/snake/index.html "(() => { const g=window.__GAME__; g.reset(1); return g.getState(); })()"
 *
 * The expression runs after `window.__GAME__.ready` is true. Its value is
 * printed as JSON. This is the debugging counterpart to `quickcheck.mjs`.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startStaticServer } from "./server-static.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [target, expr] = process.argv.slice(2);
if (!target || !expr) {
  console.error('usage: node harness/eval.mjs <path-under-public> "<js expression>"');
  process.exit(2);
}

const server = await startStaticServer({ dir: path.join(ROOT, "public") });
const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 850 } });
page.on("pageerror", (e) => console.error("pageerror:", e.message));
await page.goto(`${server.url}${target}`, { waitUntil: "networkidle" });
await page.waitForFunction(() => window.__GAME__?.ready === true, null, { timeout: 20000 }).catch(() => {
  console.error("warning: window.__GAME__ never became ready");
});

try {
  const value = await page.evaluate(`(() => (${expr}))()`);
  console.log(typeof value === "string" ? value : JSON.stringify(value, null, 1));
} catch (e) {
  console.error(String(e));
  process.exitCode = 1;
}

await browser.close();
await server.close();
