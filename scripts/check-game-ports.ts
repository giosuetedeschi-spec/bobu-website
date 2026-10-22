import assert from "node:assert/strict";
import { applyMove, finishBoard, getBestMove, initialBoard, isTerminal, legalMoves } from "../src/lib/kalaha";
import { initialState } from "../projects/typescript/kalaha/game_logic";
import { KalahaEnv } from "../projects/typescript/kalaha/training/kalaha-env";
import { predictAction, trainSelfPlay } from "../projects/typescript/kalaha/ai_training/train-tabular";
import { predictPpo, trainPpo } from "../projects/typescript/kalaha/ai_training/ppo-trainer";
import { formatBoard, parseMatchOptions } from "../projects/typescript/kalaha/main";

const opening = initialBoard();
assert.deepEqual(opening, [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0]);
const extraTurn = applyMove(opening, 2, 0);
assert.equal(extraTurn.extra, true);
assert.equal(extraTurn.board[6], 1);
assert.deepEqual(extraTurn.board.slice(2, 6), [0, 5, 5, 5]);

const capturePosition = [0, 0, 1, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0];
const captured = applyMove(capturePosition, 2, 0);
assert.equal(captured.board[6], 5);
assert.equal(captured.board[3], 0);
assert.equal(captured.board[9], 0);

const terminal = [0, 0, 0, 0, 0, 0, 2, 1, 0, 2, 0, 0, 0, 4];
assert.equal(isTerminal(terminal), true);
assert.deepEqual(finishBoard(terminal), [0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 7]);

const aiMove = getBestMove(opening, 1, 5).move;
assert.ok(aiMove !== null && legalMoves(opening, 1).includes(aiMove));

assert.equal(initialState().reduce((sum, seeds) => sum + seeds, 0), 72);
const environment = new KalahaEnv();
const observation = environment.reset();
assert.equal(observation.length, 15);
assert.deepEqual(environment.actionMask(), [true, true, true, true, true, true]);
const turn = environment.step(0);
assert.equal(turn.extraTurn, true);
assert.equal(environment.currentPlayer, 0);

const qTable = trainSelfPlay({ episodes: 10, seed: 10 });
assert.ok(Object.keys(qTable).length > 0);
assert.ok(predictAction(qTable, observation, [true, true, true, true, true, true]) !== null);
const ppo = trainPpo("scaffold", { iterations: 1, environments: 2, stepsPerEnvironment: 12, rolloutCycles: 1, seed: 5 });
assert.equal(ppo.updates, 1);
assert.equal(ppo.samples, 24);
assert.ok([...ppo.policy.weights.flat(), ...ppo.policy.bias, ...ppo.policy.valueWeights, ppo.policy.valueBias].every(Number.isFinite));
const ppoMove = predictPpo(ppo.policy, observation, environment.actionMask());
assert.ok(ppoMove !== null && environment.actionMask()[ppoMove]);
assert.equal(parseMatchOptions(["ai-human", "5", "defensive"]).mode, "ai-human");
assert.equal(parseMatchOptions(["ai-human", "5", "defensive"]).depth, 5);
assert.match(formatBoard(initialState()), /\(\s*0\)/);
console.log("Kalaha TypeScript port: rules, search, CLI, environment, tabular training, and PPO training passed.");
