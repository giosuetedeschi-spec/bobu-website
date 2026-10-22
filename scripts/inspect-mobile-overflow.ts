type DevtoolsPage = { type: string; url: string; webSocketDebuggerUrl: string };
type DevtoolsMessage = { id?: number; result?: { result?: { value?: string }; data?: string }; error?: unknown };
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const port = Number(Bun.argv[2] ?? 9333);
const width = Number(Bun.argv[3] ?? 390);
const height = Number(Bun.argv[4] ?? 844);
const routePattern = new RegExp(Bun.argv[5] ?? "kalaha|sudoku");
const pages = await fetch(`http://localhost:${port}/json/list`).then((response) => response.json()) as DevtoolsPage[];
const page = pages.find((candidate) => candidate.type === "page" && routePattern.test(candidate.url));
if (!page) throw new Error(`No page matching ${routePattern} is open in Chrome DevTools.`);

const expression = `JSON.stringify({
  url: location.href,
  viewport: [innerWidth, document.documentElement.clientWidth, document.documentElement.scrollWidth],
  overflowing: [...document.querySelectorAll("body *")].map((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return { tag: element.tagName, className: typeof element.className === "string" ? element.className : "", text: element.textContent?.trim().slice(0, 45), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width), minWidth: style.minWidth, overflowX: style.overflowX };
  }).filter((element) => element.right > innerWidth + 1).slice(-20)
})`;

const { metrics, screenshot } = await new Promise<{ metrics: string; screenshot: string }>((resolve, reject) => {
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  const pending = new Map<number, (message: DevtoolsMessage) => void>();
  const send = (id: number, method: string, params: object) => new Promise<DevtoolsMessage>((resolveMessage) => {
    pending.set(id, resolveMessage);
    socket.send(JSON.stringify({ id, method, params }));
  });
  socket.addEventListener("open", async () => {
    try {
      await send(1, "Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width <= 600 });
      const metricResult = await send(2, "Runtime.evaluate", { expression, returnByValue: true });
      const shotResult = await send(3, "Page.captureScreenshot", { format: "png" });
      socket.close();
      const metrics = metricResult.result?.result?.value;
      const screenshot = shotResult.result?.data;
      if (!metrics || !screenshot) throw new Error("Chrome DevTools returned incomplete page data.");
      resolve({ metrics, screenshot });
    } catch (error) { socket.close(); reject(error); }
  });
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data)) as DevtoolsMessage;
    if (message.id === undefined) return;
    const resolver = pending.get(message.id);
    if (!resolver) return;
    pending.delete(message.id);
    resolver(message);
  });
  socket.addEventListener("error", () => reject(new Error("Chrome DevTools connection failed.")));
});
const output = join(process.env.TEMP ?? ".", `bobu-mobile-${width}x${height}.png`);
await writeFile(output, Buffer.from(screenshot, "base64"));
console.log(JSON.stringify({ output, ...JSON.parse(metrics) }, null, 2));
