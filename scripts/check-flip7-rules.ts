import assert from "node:assert/strict";
import { Flip7Game } from "../projects/browser-game-sources/external/projects/js-demos/flip-7/src/engine.js";

const number = (value: number) => ({ type: "number" as const, value, display: String(value) });
const action = (action: "FREEZE" | "FLIP3" | "SECOND_CHANCE", display: "Freeze" | "Flip Three" | "Second Chance") => ({ type: "action" as const, value: 0 as const, display, action });
const modifier = (value: number, display: string, modifier: "POINTS" | "DOUBLE" = "POINTS") => ({ type: "modifier" as const, value, display, modifier });

let game = new Flip7Game();
assert.equal(game.deck.length, 94, "official deck composition totals 94 cards");
game.startTurn();
game.processCard(number(4));
game.processCard(modifier(0, "x2", "DOUBLE"));
game.processCard(modifier(10, "+10"));
game.stay();
assert.equal(game.totalScore, 18, "x2 doubles number points, not plus modifiers");

game = new Flip7Game();
game.startTurn();
game.processCard(number(2));
game.processCard(action("SECOND_CHANCE", "Second Chance"));
game.processCard(number(2));
assert.equal(game.isTurnActive, true, "Second Chance prevents a duplicate bust");
assert.equal(game.currentHand.filter((card) => card.type === "number").length, 1);
game.stay();
assert.equal(game.totalScore, 2);

game = new Flip7Game();
game.startTurn();
for (let value = 1; value <= 7; value++) game.processCard(number(value));
assert.equal(game.totalScore, 43, "seven distinct number cards bank +15 and end the hand");
assert.equal(game.isTurnActive, false);

game = new Flip7Game();
game.startTurn();
game.processCard(number(5));
game.processCard(number(5));
assert.equal(game.totalScore, 0, "duplicate number bust banks zero");
assert.equal(game.isTurnActive, false);

game = new Flip7Game();
game.totalScore = 190;
let winAnnounced = false;
game.ui.onWin = () => { winAnnounced = true; };
game.startTurn();
game.processCard(number(10));
game.stay();
assert.equal(game.totalScore, 200);
assert.equal(winAnnounced, true, "reaching the target announces the win");

game = new Flip7Game();
game.startTurn();
game.deck = [number(3), number(4), number(5)];
game.processCard(action("FLIP3", "Flip Three"));
await new Promise((resolve) => setTimeout(resolve, 3000));
assert.equal(game.currentHand.filter((card) => card.type === "number").length, 3, "Flip Three draws three cards");
console.log("Flip 7 rules checks passed.");
