export function gaussianNoise(size: number, seed: number): Float32Array {
  const random = mulberry32(seed);
  const data = new Float32Array(size * size * 2);
  for (let index = 0; index < size * size; index++) {
    const u1 = Math.max(random(), 1e-7);
    const u2 = random();
    const radius = Math.sqrt(-2 * Math.log(u1));
    data[index * 2] = radius * Math.cos(2 * Math.PI * u2);
    data[index * 2 + 1] = radius * Math.sin(2 * Math.PI * u2);
  }
  return data;
}

function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
