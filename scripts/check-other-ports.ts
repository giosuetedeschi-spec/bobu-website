import assert from "node:assert/strict";
import { evaluateExpression } from "../projects/typescript/pygame_calculator/calculator";
import { Interpolated, easingFunctions } from "../projects/typescript/InterpolationEngine/interpolation";
import { sortingAlgorithms } from "../projects/typescript/sorting_algo_visualizer";

assert.equal(evaluateExpression("(2 + 3) * 4 - 8 / 2"), 16);
assert.equal(evaluateExpression("-3 + +5"), 2);
assert.throws(() => evaluateExpression("1 / 0"), /Division by zero/);
assert.throws(() => evaluateExpression("globalThis.process.exit()"), /Invalid expression/);

let now = 10;
const transition = new Interpolated<number>(0, 2, "linear", () => now);
transition.value = 10;
now = 11;
assert.equal(transition.value, 5);
transition.setValue(20);
assert.equal(transition.value, 5);
now = 12;
assert.equal(transition.value, 12.5);
assert.equal(easingFunctions.easeOutElastic(1), 1);
let vectorTime = 0;
const vector = new Interpolated<{ x: number; y: number }>({ x: 0, y: 4 }, 2, "linear", () => vectorTime);
vector.setValue({ x: 10, y: 8 });
vectorTime = 1;
assert.deepEqual(vector.value, { x: 5, y: 6 });
for (const [name, sort] of Object.entries(sortingAlgorithms)) {
  const input = name.startsWith("Cached bogo") ? [3, 1, 2, 5, 0, 4] : [3, 1, 4, 1, 5, 9, 2];
  const sorted = [...sort([...input])].at(-1)?.values ?? input;
  assert.deepEqual(sorted, [...input].sort((a, b) => a - b), `${name} failed`);
}
const duplicateBogo = [...sortingAlgorithms["Cached bogo (max 6 values)"]([2, 1, 2, 1, 0, 0])].at(-1)?.values;
assert.deepEqual(duplicateBogo, [0, 0, 1, 1, 2, 2]);
console.log("Calculator, interpolation, and sorting TypeScript ports passed.");
