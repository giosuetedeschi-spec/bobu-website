/**
 * Snake — deterministic PRNG.
 *
 * The harness contract requires that `reset(seed)` makes an entire run
 * reproducible, so nothing in the simulation may touch Math.random().
 * mulberry32: tiny, fast, well-distributed for game use.
 */

export function makeRng(seed = 1) {
  let a = (seed >>> 0) || 0x9e3779b9;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.int = (n) => Math.floor(next() * n); // integer in [0, n)
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  return next;
}
