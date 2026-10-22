import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { PPO_PROFILES, trainPpo, type PpoProfileName } from "./ppo-trainer";

const requestedProfile = process.argv[2] ?? "scaffold";
if (!Object.prototype.hasOwnProperty.call(PPO_PROFILES, requestedProfile)) throw new Error(`Choose one profile: ${Object.keys(PPO_PROFILES).join(", ")}.`);
const profile = requestedProfile as PpoProfileName;
const iterations = process.argv[3] === undefined ? undefined : Number(process.argv[3]);
if (iterations !== undefined && (!Number.isInteger(iterations) || iterations < 1 || iterations > 100_000)) throw new Error("Iterations must be an integer from 1 to 100000.");
const output = resolve(process.argv[4] ?? `projects/typescript/kalaha/models/kalaha-${profile}-policy.json`);
const model = trainPpo(profile, iterations === undefined ? {} : { iterations });
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(model)}\n`, "utf8");
console.log(`Trained ${model.samples} steps with ${profile}; saved policy to ${output}.`);
