import type { KalahaBoard } from "../../../../src/lib/kalaha";
import { KalahaEnv } from "../training/kalaha-env";

export type TrainingOptions = { episodes?: number; alpha?: number; gamma?: number; epsilon?: number; seed?: number };
export type QTable = Record<string, number[]>;

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const stateKey = (observation: number[]) => observation.join(",");
const max = (values: number[]) => Math.max(...values);

export function trainSelfPlay({ episodes = 1_000, alpha = 0.15, gamma = 0.98, epsilon = 0.2, seed = 42 }: TrainingOptions = {}): QTable {
  const random = seededRandom(seed);
  const environment = new KalahaEnv();
  const table: QTable = {};
  const getValues = (key: string) => table[key] ??= Array(6).fill(0);

  for (let episode = 0; episode < episodes; episode++) {
    environment.reset();
    let explore = epsilon * Math.max(0.05, 1 - episode / episodes);
    for (let move = 0; move < environment.maxMoves; move++) {
      const observation = environment.observation();
      const mask = environment.actionMask();
      const legal = mask.flatMap((allowed, action) => allowed ? [action] : []);
      if (!legal.length) break;
      const key = stateKey(observation);
      const values = getValues(key);
      const best = Math.max(...legal.map((action) => values[action]));
      const bestActions = legal.filter((action) => values[action] === best);
      const action = random() < explore
        ? legal[Math.floor(random() * legal.length)]
        : bestActions[Math.floor(random() * bestActions.length)];
      const result = environment.step(action);
      const nextValues = result.terminated || result.truncated ? [] : getValues(stateKey(result.observation));
      const future = nextValues.length ? max(nextValues.filter((_, i) => environment.actionMask()[i])) : 0;
      const nextPlayerScale = result.extraTurn ? 1 : -1;
      const target = result.reward + (result.terminated || result.truncated ? 0 : gamma * nextPlayerScale * future);
      values[action] += alpha * (target - values[action]);
      if (result.terminated || result.truncated) break;
      explore *= 0.999;
    }
  }
  return table;
}

export function predictAction(table: QTable, observation: number[], mask: boolean[]): number | null {
  const legal = mask.flatMap((allowed, action) => allowed ? [action] : []);
  if (!legal.length) return null;
  const values = table[stateKey(observation)] ?? Array(6).fill(0);
  return legal.reduce((best, action) => values[action] > values[best] ? action : best, legal[0]);
}

export function boardToObservation(board: KalahaBoard): number[] {
  return [...board.slice(0, 6), board[6], ...board.slice(7, 13), board[13], 0];
}
