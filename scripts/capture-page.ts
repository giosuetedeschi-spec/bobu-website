import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";

type DevtoolsPage = { type: string; webSocketDebuggerUrl: string };
type DevtoolsMessage = { id?: number; method?: string; result?: { data?: string }; error?: unknown };

const port = Number(Bun.argv[2] ?? 9334);
const url = Bun.argv[3] ?? "http://localhost:3022/bobu-website/";
const width = Number(Bun.argv[4] ?? 1280);
const height = Number(Bun.argv[5] ?? 900);
const output = resolve(Bun.argv[6] ?? join(tmpdir(), "bobu-page-review.png"));
const pages = await fetch(`http://localhost:${port}/json/list`).then((response) => response.json()) as DevtoolsPage[];
const page = pages.find((candidate) => candidate.type === "page");
if (!page) throw new Error("Chrome DevTools has no open page.");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise<void>((resolveOpen, reject) => {
  socket.addEventListener("open", () => resolveOpen(), { once: true });
  socket.addEventListener("error", () => reject(new Error("Chrome DevTools connection failed.")), { once: true });
});
let requestId = 0;
const pending = new Map<number, { resolve: (message: DevtoolsMessage) => void; timer: ReturnType<typeof setTimeout> }>();
let loadPage: (() => void) | undefined;
socket.addEventListener("message", (event) => {
  const message = JSON.parse(String(event.data)) as DevtoolsMessage;
  if (message.method === "Page.loadEventFired") loadPage?.();
  if (message.id === undefined) return;
  const request = pending.get(message.id);
  if (request) { pending.delete(message.id); clearTimeout(request.timer); request.resolve(message); }
});

function send(method: string, params: object = {}): Promise<DevtoolsMessage> {
  const id = ++requestId;
  return new Promise((resolveMessage, reject) => {
    const timer = setTimeout(() => {
      if (pending.delete(id)) reject(new Error(`Timed out waiting for ${method}.`));
    }, 10_000);
    pending.set(id, { resolve: resolveMessage, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width <= 600 });
const loaded = new Promise<void>((resolveLoad) => { loadPage = resolveLoad; });
await send("Page.navigate", { url });
let loadTimeout: ReturnType<typeof setTimeout> | undefined;
await Promise.race([loaded, new Promise<void>((resolveLoad) => { loadTimeout = setTimeout(resolveLoad, 10_000); })]);
if (loadTimeout) clearTimeout(loadTimeout);
loadPage = undefined;
await new Promise((resolveDelay) => setTimeout(resolveDelay, 350));
const screenshot = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
if (!screenshot.result?.data) throw new Error("Chrome DevTools did not return a screenshot.");
await writeFile(output, Buffer.from(screenshot.result.data, "base64"));
socket.close();
console.log(`Saved ${width}x${height} screenshot to ${output}.`);
