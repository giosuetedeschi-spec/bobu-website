import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { trainSelfPlay } from "./train-tabular";

const episodes = Number(process.argv[2] ?? 1_000);
if (!Number.isInteger(episodes) || episodes < 1 || episodes > 100_000) {
  throw new Error("Pass an episode count from 1 to 100000.");
}
const output = resolve(process.argv[3] ?? "projects/typescript/kalaha/models/kalaha-qtable.json");
const qTable = trainSelfPlay({ episodes });
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(qTable)}\n`, "utf8");
console.log(`Trained ${episodes} self-play episodes; saved ${Object.keys(qTable).length} positions to ${output}.`);
