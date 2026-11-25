// A tiny seeded random generator (mulberry32), so a screenshot seed always
// stages the same frame and a run can be replayed from its seed alone.

export function createRandom(seed) {
  let a = seed >>> 0;
  return {
    /** Next float in [0, 1). */
    next() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** Integer in [0, n). */
    int(n) {
      return Math.floor(this.next() * n);
    },
    /** One element of `list`, uniformly. */
    pick(list) {
      return list[Math.floor(this.next() * list.length)];
    },
    /** Float in [min, max). */
    range(min, max) {
      return min + this.next() * (max - min);
    },
  };
}

// The generator's seed, for the rare caller that wants to re-seed mid-run.
export function seedOf(seed) {
  return seed >>> 0;
}
