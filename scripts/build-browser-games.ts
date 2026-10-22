import { mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const sourceRoot = resolve("projects/browser-game-sources");
const manifest = JSON.parse(await readFile(resolve(sourceRoot, "manifest.json"), "utf8")) as Array<{ source: string; output: string }>;
const transpiler = new Bun.Transpiler({ loader: "ts" });
const portablePath = (path: string) => path.replaceAll("\\", "/");

for (const entry of manifest) {
  const source = await readFile(resolve(sourceRoot, portablePath(entry.source)), "utf8");
  const output = resolve(portablePath(entry.output));
  await mkdir(dirname(output), { recursive: true });
  await Bun.write(output, await transpiler.transform(source));
}

console.log(`Built ${manifest.length} browser game scripts with Bun.`);
