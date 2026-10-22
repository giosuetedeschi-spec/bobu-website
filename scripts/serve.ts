import { extname, resolve, sep } from "node:path";

const root = resolve("out");
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const mimeTypes: Record<string, string> = {
  ".avif": "image/avif", ".css": "text/css; charset=utf-8", ".gif": "image/gif",
  ".html": "text/html; charset=utf-8", ".ico": "image/x-icon", ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg", ".js": "text/javascript; charset=utf-8", ".json": "application/json",
  ".md": "text/markdown; charset=utf-8", ".mp3": "audio/mpeg", ".mp4": "video/mp4",
  ".ogg": "audio/ogg", ".otf": "font/otf", ".pdf": "application/pdf", ".png": "image/png",
  ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8", ".ttf": "font/ttf",
  ".wasm": "application/wasm", ".wav": "audio/wav", ".webm": "video/webm", ".webp": "image/webp",
  ".woff": "font/woff", ".woff2": "font/woff2", ".xml": "application/xml; charset=utf-8",
};

if (!await Bun.file(resolve(root, "index.html")).exists()) throw new Error("Static export is missing. Run `bun run build` first.");

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  async fetch(request) {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);
    if (basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))) pathname = pathname.slice(basePath.length) || "/";
    const requested = resolve(root, pathname.replace(/^\/+/, ""));
    if (requested !== root && !requested.startsWith(`${root}${sep}`)) return new Response("Not found", { status: 404 });
    const candidates = pathname.endsWith("/")
      ? [resolve(requested, "index.html")]
      : [requested, `${requested}.html`, resolve(requested, "index.html")];
    for (const path of candidates) {
      const file = Bun.file(path);
      if (await file.exists()) return new Response(file, { headers: { "content-type": mimeTypes[extname(path).toLowerCase()] ?? "application/octet-stream" } });
    }
    const notFound = Bun.file(resolve(root, "404.html"));
    return new Response(await notFound.exists() ? notFound : "Not found", { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
  },
});

console.log(`Static site: ${server.url}`);
