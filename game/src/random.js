// A tiny seeded random generator (mulberry32) so the world, the stars and the
// screenshot scenes are the same for the same seed, every run.
export function createRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A number in [min, max). */
export function randomRange(random, min, max) {
  return min + random() * (max - min);
}

/** An integer in [min, max]. */
export function randomInt(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}
