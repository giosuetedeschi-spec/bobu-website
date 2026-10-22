import assert from "node:assert/strict";
import { applyBitwiseOperation, BinaryArithmetic } from "../projects/browser-game-sources/external/projects/js-demos/bitwise-ops/js/main.js";

for (let a = 0; a <= 255; a++) {
  for (let b = 0; b <= 255; b++) {
    assert.equal(applyBitwiseOperation(a, b, "and"), a & b);
    assert.equal(applyBitwiseOperation(a, b, "or"), a | b);
    assert.equal(applyBitwiseOperation(a, b, "xor"), a ^ b);
    assert.equal(BinaryArithmetic.add(a, b).result, (a + b) & 0xff);
    assert.equal(BinaryArithmetic.subtract(a, b).result, (a - b + 256) & 0xff);
    assert.equal(BinaryArithmetic.multiply(a, b).result, (a * b) & 0xff);
    if (b > 0) {
      const division = BinaryArithmetic.divide(a, b);
      assert.equal(division.result, Math.floor(a / b));
      assert.equal(division.remainder, a % b);
    }
  }
  assert.equal(applyBitwiseOperation(a, 0, "not"), (~a) & 0xff);
  for (let shift = 0; shift <= 255; shift++) {
    assert.equal(applyBitwiseOperation(a, shift, "lshift"), shift >= 8 ? 0 : (a << shift) & 0xff);
    assert.equal(applyBitwiseOperation(a, shift, "rshift"), shift >= 8 ? 0 : a >> shift);
  }
}
assert.match(BinaryArithmetic.divide(7, 0).steps[0].description, /Division by zero/);
console.log("Bitwise and 8-bit arithmetic exhaustive checks passed (65,536 input pairs).");
