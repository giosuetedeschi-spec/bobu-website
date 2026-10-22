import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";

const publicRoot = resolve("public");
const sourceRoot = resolve("projects/browser-game-sources");
const inlinePages = ["abalone", "azul", "breakout", "flappy-bird", "mastermind", "mirror-drift", "pong", "tris", "twins"];
const manifest: Array<{ source: string; output: string }> = [];
const existingManifest = JSON.parse(await readFile(resolve(sourceRoot, "manifest.json"), "utf8")) as Array<{ source: string; output: string }>;
const existingByOutput = new Map(existingManifest.map((entry) => [resolve(entry.output).toLowerCase(), entry]));
const inlineOutputs = new Set(inlinePages.map((slug) => resolve(`public/games/${slug}/game.js`).toLowerCase()));

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
  const output = relative(resolve("."), jsFile).replace(/\\/g, "/");
  const existing = existingByOutput.get(resolve(output).toLowerCase());
  if (existing || inlineOutputs.has(resolve(output).toLowerCase())) {
    if (existing) manifest.push(existing);
    continue;
  }
  const source = resolve(sourceRoot, "external", relativePath.replace(/\.js$/, ".ts"));
  await mkdir(dirname(source), { recursive: true });
  try {
    const content = await readFile(source, "utf8");
    if (!content.startsWith("// @ts-nocheck")) await writeFile(source, `// @ts-nocheck\n${content}`, "utf8");
  } catch {
    const content = await readFile(jsFile, "utf8");
    await writeFile(source, `// @ts-nocheck\n${content}`, "utf8");
  }
  manifest.push({
    source: relative(sourceRoot, source).replace(/\\/g, "/"),
    output,
  });
}

for (const slug of inlinePages) {
  const htmlPath = resolve(publicRoot, "games", slug, "index.html");
  const html = await readFile(htmlPath, "utf8");
  const source = resolve(sourceRoot, "inline", `${slug}.ts`);
  const output = `public/games/${slug}/game.js`;
  const existing = existingByOutput.get(resolve(output).toLowerCase());
  if (existing) {
    manifest.push(existing);
    continue;
  }
  await mkdir(dirname(source), { recursive: true });
  try {
    const content = await readFile(source, "utf8");
    if (!content.startsWith("// @ts-nocheck")) await writeFile(source, `// @ts-nocheck\n${content}`, "utf8");
    manifest.push({ source: relative(sourceRoot, source).replace(/\\/g, "/"), output });
    continue;
  } catch {
    // The source has not been migrated yet; extract the inline script below.
  }
  const script = /<script\b([^>]*)>([\s\S]*?)<\/script>/i;
  const match = html.match(script);
  if (!match || /\bsrc\s*=/.test(match[1])) throw new Error(`Expected one inline game script in ${htmlPath}`);
  await writeFile(source, `// @ts-nocheck\n${match[2].trim()}\n`, "utf8");
  await writeFile(htmlPath, html.replace(script, '<script src="./game.js"></script>'), "utf8");
  manifest.push({ source: relative(sourceRoot, source).replace(/\\/g, "/"), output });
}

const uniqueManifest = [...new Map(manifest.map((entry) => [resolve(entry.output).toLowerCase(), entry])).values()];
await writeFile(resolve(sourceRoot, "manifest.json"), JSON.stringify(uniqueManifest, null, 2) + "\n", "utf8");
console.log(`Migrated ${uniqueManifest.length} browser scripts to TypeScript sources.`);
