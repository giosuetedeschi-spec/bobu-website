import { readdir } from "node:fs/promises";
import { relative, resolve } from "node:path";

type DevtoolsPage = { type: string; url: string; webSocketDebuggerUrl: string };
type DevtoolsMessage = {
  id?: number;
  method?: string;
  params?: { type?: string; args?: Array<{ value?: unknown; description?: string }>; exceptionDetails?: { text?: string; exception?: { description?: string }; url?: string; lineNumber?: number } };
  error?: unknown;
  result?: { result?: { value?: string } };
};
const port = Number(Bun.argv[2] ?? 9334);
const baseUrl = Bun.argv[3] ?? "http://localhost:3022/bobu-website";
const width = Number(Bun.argv[4] ?? 390);
const height = Number(Bun.argv[5] ?? 844);
const routeFilter = Bun.argv[6];
const pages = await fetch(`http://localhost:${port}/json/list`).then((response) => response.json()) as DevtoolsPage[];
const target = pages.find((page) => page.type === "page");
if (!target) throw new Error("Chrome DevTools has no open page.");

async function htmlFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const children = await Promise.all(entries.map((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? htmlFiles(path) : entry.name === "index.html" ? [path] : [];
  }));
  return children.flat();
}

const root = resolve("out");
const allRoutes = (await htmlFiles(root))
  .map((file) => `/${relative(root, file).replace(/\\/g, "/").replace(/(?:^|\/)index\.html$/, "")}`.replace(/\/$/, "/"))
  .filter((route) => route !== "/404/");
const routes = routeFilter === "^/$"
  ? allRoutes.filter((route) => route === "/")
  : routeFilter ? allRoutes.filter((route) => route === routeFilter || route.includes(routeFilter)) : allRoutes;

let requestId = 0;
const pending = new Map<number, (message: DevtoolsMessage) => void>();
let pageLoad: (() => void) | undefined;
const consoleErrors: string[] = [];
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise<void>((resolveOpen, reject) => {
  socket.addEventListener("open", () => resolveOpen(), { once: true });
  socket.addEventListener("error", () => reject(new Error("Chrome DevTools connection failed.")), { once: true });
});
socket.addEventListener("message", (event) => {
  const message = JSON.parse(String(event.data)) as DevtoolsMessage;
  if (message.method === "Page.loadEventFired") pageLoad?.();
  if (typeof message.id !== "number") return;
  const resolver = pending.get(message.id);
  if (resolver) { pending.delete(message.id); resolver(message); }
});

function send(method: string, params: object = {}): Promise<DevtoolsMessage> {
  const id = ++requestId;
  return new Promise((resolveMessage) => {
    pending.set(id, resolveMessage);
    socket.send(JSON.stringify({ id, method, params }));
  });
}

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width <= 600 });
const results: Array<{ route: string; width: number; scrollWidth: number; overflow: Array<{ tag: string; className: string; right: number }>; iframeOverflow: Array<{ src: string; width: number; scrollWidth: number }> }> = [];
const runtimeErrors: string[] = [];
await send("Runtime.enable");
socket.addEventListener("message", (event) => {
  const message = JSON.parse(String(event.data)) as DevtoolsMessage;
  if (message.method === "Runtime.exceptionThrown") {
    const details = message.params?.exceptionDetails;
    if (details) {
      const summary = details.exception?.description?.split("\n")[0] ?? details.text ?? "Uncaught browser exception";
      runtimeErrors.push(`${summary} (${details.url ?? "unknown source"}:${(details.lineNumber ?? 0) + 1})`);
    }
  }
  if (message.method === "Runtime.consoleAPICalled" && message.params?.type === "error") {
    consoleErrors.push(JSON.stringify(message.params.args?.map((argument) => argument.value ?? argument.description)));
  }
});
const pageErrors: Array<{ route: string; errors: string[] }> = [];

for (const route of routes) {
  const errorStart = runtimeErrors.length;
  const consoleStart = consoleErrors.length;
  const loaded = new Promise<void>((resolveLoad) => { pageLoad = resolveLoad; });
  await send("Page.navigate", { url: `${baseUrl}${route}` });
  await Promise.race([loaded, new Promise((resolveLoad) => setTimeout(resolveLoad, 6000))]);
  pageLoad = undefined;
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 120));
  const evaluation = await send("Runtime.evaluate", {
    returnByValue: true,
    expression: `JSON.stringify({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, overflow: [...document.querySelectorAll("body *")].map((element) => { const rect = element.getBoundingClientRect(); return { tag: element.tagName, className: typeof element.className === "string" ? element.className : "", right: Math.round(rect.right) }; }).filter((element) => element.right > innerWidth + 1).slice(-5), iframeOverflow: [...document.querySelectorAll("iframe")].flatMap((frame) => { const child = frame.contentDocument; if (!child) return []; const width = frame.clientWidth; const scrollWidth = child.documentElement?.scrollWidth ?? 0; return scrollWidth > width + 1 ? [{ src: new URL(frame.src).pathname, width, scrollWidth }] : []; }) })`,
  });
  const metrics = evaluation.result?.result?.value;
  if (!metrics) throw new Error(`No layout metrics returned for ${route}.`);
  results.push({ route, ...JSON.parse(metrics) });
  if (runtimeErrors.length > errorStart || consoleErrors.length > consoleStart) pageErrors.push({ route, errors: [...runtimeErrors.slice(errorStart), ...consoleErrors.slice(consoleStart)] });
}

socket.close();
const overflowing = results.filter((result) => result.scrollWidth > result.width || result.overflow.length > 0 || result.iframeOverflow.length > 0);
console.log(JSON.stringify({ pages: results.length, viewport: `${width}x${height}`, overflowing, pageErrors }, null, 2));
