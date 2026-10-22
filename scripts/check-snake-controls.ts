import assert from "node:assert/strict";
import { TitleScene, type SceneHost, type SceneKeys } from "../projects/browser-game-sources/external/games/snake/js/scenes.js";

const host: SceneHost = { pushScene: () => {}, popScene: () => {} };
const scene = new TitleScene(host);
const keys: SceneKeys = { ArrowUp: true };
scene.handleInput(keys);
assert.equal(scene.selected, 1, "ArrowUp moves the title selection once");
assert.equal(keys.ArrowUp, false, "ArrowUp is consumed after handling");
scene.handleInput(keys);
assert.equal(scene.selected, 1, "a consumed key does not repeat on each game tick");
keys.w = true;
scene.handleInput(keys);
assert.equal(scene.selected, 0, "W moves the menu back to Play");
assert.equal(keys.w, false);
console.log("Snake title menu controls passed.");
