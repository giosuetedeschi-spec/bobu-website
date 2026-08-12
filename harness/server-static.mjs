import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".py": "text/x-python; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm",
  ".md": "text/markdown; charset=utf-8",
};

/**
 * Serves the static export in `out/`. Mirrors the two behaviours of the real
 * host that the harness depends on: extensionless routes resolve to
 * `<route>.html` (or `<route>/index.html`), and /games/* gets the COOP/COEP
 * headers that next.config.ts declares but static export cannot apply.
 */
export function startStaticServer({ dir = path.join(ROOT, "out"), port = 0 } = {}) {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const candidates = [];
    const direct = path.join(dir, urlPath);

    if (urlPath.endsWith("/")) {
      candidates.push(path.join(direct, "index.html"));
    } else if (path.extname(urlPath)) {
      candidates.push(direct);
    } else {
      candidates.push(`${direct}.html`, path.join(direct, "index.html"));
    }

    const file = candidates.find((c) => c.startsWith(dir) && fs.existsSync(c) && fs.statSync(c).isFile());
    if (!file) {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end(`404 ${urlPath}`);
      return;
    }

    const headers = { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" };
    if (urlPath.startsWith("/games/")) {
      headers["Cross-Origin-Opener-Policy"] = "same-origin";
      headers["Cross-Origin-Embedder-Policy"] = "require-corp";
    }
    // Same-origin iframes need this to be embeddable under COEP.
    headers["Cross-Origin-Resource-Policy"] = "same-origin";
    res.writeHead(200, headers);
    fs.createReadStream(file).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      const { port: actual } = server.address();
      resolve({
        url: `http://127.0.0.1:${actual}`,
        port: actual,
        close: () => new Promise((r) => server.close(r)),
      });
    });
  });
}
