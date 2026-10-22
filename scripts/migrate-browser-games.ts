import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";

const publicRoot = resolve("public");
const sourceRoot = resolve("projects/browser-game-sources");
const inlinePages = ["abalone", "azul", "flappy-bird", "mastermind", "pong", "tris"];
const manifest: Array<{ source: string; output: string }> = [];

async function walk(path: string): Promise<string[]> {
  const entries = await readdir(path, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const child = resolve(path, entry.name);
    return entry.isDirectory() ? walk(child) : [child];
  }));
  return files.flat();
}

await mkdir(sourceRoot, { recursive: true });
for (const jsFile of (await walk(publicRoot)).filter((file) => extname(file) === ".js")) {
  const relativePath = relative(publicRoot, jsFile).replace(/\\/g, "/");
  const source = resolve(sourceRoot, "external", relativePath.replace(/\.js$/, ".ts"));
  await mkdir(dirname(source), { recursive: true });
  await cp(jsFile, source);
  manifest.push({
    source: relative(sourceRoot, source).replace(/\\/g, "/"),
    output: relative(resolve("."), jsFile).replace(/\\/g, "/"),
  });
}

for (const slug of inlinePages) {
  const htmlPath = resolve(publicRoot, "games", slug, "index.html");
  const html = await readFile(htmlPath, "utf8");
  const script = /<script\b([^>]*)>([\s\S]*?)<\/script>/i;
  const match = html.match(script);
  if (!match || /\bsrc\s*=/.test(match[1])) throw new Error(`Expected one inline game script in ${htmlPath}`);
  const source = resolve(sourceRoot, "inline", `${slug}.ts`);
  await mkdir(dirname(source), { recursive: true });
  await writeFile(source, match[2].trim() + "\n", "utf8");
  await writeFile(htmlPath, html.replace(script, '<script src="./game.js"></script>'), "utf8");
  manifest.push({ source: relative(sourceRoot, source).replace(/\\/g, "/"), output: `public/games/${slug}/game.js` });
}

await writeFile(resolve(sourceRoot, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(`Migrated ${manifest.length} browser scripts to TypeScript sources.`);
