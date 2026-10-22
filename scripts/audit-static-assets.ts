import { readdir, stat } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";

const root = resolve("out");
const publicRoot = resolve("public");
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const publicOrigin = "https://bobu-static.invalid";

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  }));
  return nested.flat();
}

const files = await walk(root);
const htmlFiles = files.filter((path) => extname(path).toLowerCase() === ".html");
const cssFiles = files.filter((path) => extname(path).toLowerCase() === ".css");
const fileSet = new Set(files.map((path) => path.toLowerCase()));
const issues = new Set<string>();

async function checkReference(reference: string, sourceFile: string, documentUrl: URL) {
  if (!reference || /^(?:data:|blob:|mailto:|tel:|javascript:|#)/i.test(reference)) return;
  let resolvedUrl: URL;
  try { resolvedUrl = new URL(reference, documentUrl); } catch { return; }
  if (resolvedUrl.origin !== publicOrigin) return;
  let pathname = decodeURIComponent(resolvedUrl.pathname);
  if (basePath && pathname !== basePath && !pathname.startsWith(`${basePath}/`)) {
    issues.add(`${relative(root, sourceFile)} -> missing base path: ${resolvedUrl.pathname}`);
    return;
  }
  if (basePath) pathname = pathname.slice(basePath.length) || "/";
  const requested = resolve(root, pathname.replace(/^\/+/, ""));
  if (requested !== root && !requested.startsWith(`${root}${sep}`)) {
    issues.add(`${relative(root, sourceFile)} -> path escapes export: ${resolvedUrl.pathname}`);
    return;
  }
  const candidates = pathname.endsWith("/")
    ? [resolve(requested, "index.html")]
    : [requested, `${requested}.html`, resolve(requested, "index.html")];
  let found = false;
  for (const candidate of candidates) {
    if (fileSet.has(candidate.toLowerCase())) { found = true; break; }
    try { if ((await stat(candidate)).isFile()) { found = true; break; } } catch { /* Try the next static export form. */ }
  }
  if (!found) issues.add(`${relative(root, sourceFile)} -> missing file: ${resolvedUrl.pathname}`);
}

const baseDocumentUrl = (file: string) => {
  const relativePath = relative(root, file).replace(/\\/g, "/");
  const routePath = relativePath.replace(/(?:^|\/)index\.html$/i, "/");
  return new URL(`${basePath}/${routePath}`.replace(/\/{2,}/g, "/"), publicOrigin);
};

for (const file of htmlFiles) {
  const html = await Bun.file(file).text();
  const documentUrl = baseDocumentUrl(file);
  const references = [...html.matchAll(/(?:href|src|poster)=["']([^"']+)["']/gi)].map((match) => match[1]);
  references.push(...[...html.matchAll(/url\(["']?([^)'"\s]+)["']?\)/gi)].map((match) => match[1]));
  for (const reference of references) await checkReference(reference, file, documentUrl);
  if (/<script\b[^>]*\bsrc=["']https?:\/\//i.test(html) || /<link\b(?=[^>]*\brel=["']stylesheet["'])[^>]*\bhref=["']https?:\/\//i.test(html)) {
    issues.add(`${relative(root, file)} -> external script and stylesheet dependencies are not bundled with the site.`);
  }
}

for (const file of cssFiles) {
  const css = await Bun.file(file).text();
  const url = baseDocumentUrl(file);
  for (const match of css.matchAll(/url\(["']?([^)'"\s]+)["']?\)/gi)) await checkReference(match[1], file, url);
}

const publicFiles = await walk(publicRoot);
const publicHtmlFiles = publicFiles.filter((path) => extname(path).toLowerCase() === ".html");
const publicJsFiles = publicFiles.filter((path) => extname(path).toLowerCase() === ".js");
const manifest = JSON.parse(await Bun.file(resolve("projects/browser-game-sources/manifest.json")).text()) as Array<{ source: string; output: string }>;
for (const entry of manifest) {
  if (entry.source.includes("\\") || entry.output.includes("\\")) issues.add(`manifest -> paths must use portable forward slashes: ${entry.source} -> ${entry.output}`);
}
const generatedJs = new Set(manifest.map((entry) => resolve(entry.output).toLowerCase()));
for (const file of publicJsFiles) if (!generatedJs.has(resolve(file).toLowerCase())) issues.add(`${relative(publicRoot, file)} -> JavaScript has no TypeScript build source.`);
for (const output of generatedJs) if (!publicJsFiles.some((file) => resolve(file).toLowerCase() === output)) issues.add(`${output} -> expected generated JavaScript is missing.`);
for (const file of publicHtmlFiles) {
  const html = await Bun.file(file).text();
  if (/\son[a-z]+\s*=/i.test(html)) issues.add(`${relative(publicRoot, file)} -> inline JavaScript event handler must move to TypeScript or a link.`);
  if (/<script(?![^>]*\bsrc\s*=)[^>]*>/i.test(html)) issues.add(`${relative(publicRoot, file)} -> inline script must move to a TypeScript source.`);
  if (/<script\b[^>]*\bsrc=["']https?:\/\//i.test(html) || /<link\b(?=[^>]*\brel=["']stylesheet["'])[^>]*\bhref=["']https?:\/\//i.test(html)) {
    issues.add(`${relative(publicRoot, file)} -> external script and stylesheet dependencies are not bundled with the site.`);
  }
}

if (issues.size) {
  console.error([...issues].join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Static audit passed: ${htmlFiles.length} HTML pages, ${cssFiles.length} stylesheets, ${publicJsFiles.length} generated browser scripts (${basePath || "root deployment"}).`);
}
