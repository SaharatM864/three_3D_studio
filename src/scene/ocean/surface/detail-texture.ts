import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  RGBAFormat,
  UnsignedByteType,
} from "three";

import { DETAIL_MEAN, DETAIL_STD, DETAIL_TEXTURE_SIZE } from "./constants";

const CELL_COUNT_COARSE = 5;
const CELL_COUNT_FINE = 11;
const RADIUS_SIGMA = 0.45;
const FBM_OCTAVES = 5;
const FBM_PERSISTENCE = 0.68;
const FBM_SEED = 1234567;
const CELL_SEED_COARSE = 0x9e3779b9;
const CELL_SEED_FINE = 0x85ebca6b;

export function createDetailTexture(size = DETAIL_TEXTURE_SIZE): DataTexture {
  const random = lcg(FBM_SEED);
  const noise = new Float32Array(size * size);
  for (let index = 0; index < noise.length; index++) noise[index] = random();

  const coarse = renormalise(
    cellularField(size, CELL_COUNT_COARSE, RADIUS_SIGMA, CELL_SEED_COARSE)
  );
  const fine = renormalise(
    cellularField(size, CELL_COUNT_FINE, RADIUS_SIGMA, CELL_SEED_FINE)
  );
  const fbm = createFbm(noise, size);

  const quantise = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value + (random() - 0.5))));
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const texel = y * size + x;
      const offset = texel * 4;
      data[offset] = quantise(coarse[texel] * 255);
      data[offset + 1] = quantise(fine[texel] * 255);
      data[offset + 2] = quantise(fbm(u, v) * 255);
      data[offset + 3] = quantise(fbm(u * 2, v * 2) * 255);
    }
  }

  const texture = new DataTexture(
    data,
    size,
    size,
    RGBAFormat,
    UnsignedByteType
  );
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function lcg(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function mulberry(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cellularField(
  size: number,
  cells: number,
  sigmaLog: number,
  seed: number
): Float32Array {
  const random = mulberry(seed);
  const count = cells * cells;
  const px = new Float32Array(count);
  const py = new Float32Array(count);
  const pr = new Float32Array(count);
  for (let index = 0; index < count; index++) {
    px[index] = random();
    py[index] = random();
    const u1 = Math.max(random(), 1e-9);
    const u2 = random();
    const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    pr[index] = Math.exp(gaussian * sigmaLog);
  }

  const field = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    const fy = (y / size) * cells;
    const cy = Math.floor(fy);
    for (let x = 0; x < size; x++) {
      const fx = (x / size) * cells;
      const cx = Math.floor(fx);
      let best = 1e9;
      for (let oy = -2; oy <= 2; oy++) {
        const gy = (((cy + oy) % cells) + cells) % cells;
        for (let ox = -2; ox <= 2; ox++) {
          const gx = (((cx + ox) % cells) + cells) % cells;
          const cell = gy * cells + gx;
          const dx = cx + ox + px[cell] - fx;
          const dy = cy + oy + py[cell] - fy;
          const distance = Math.sqrt(dx * dx + dy * dy) / pr[cell];
          if (distance < best) best = distance;
        }
      }
      field[y * size + x] = best;
    }
  }
  return field;
}

function renormalise(field: Float32Array): Float32Array {
  let sum = 0;
  let sumSquares = 0;
  for (const value of field) {
    sum += value;
    sumSquares += value * value;
  }
  const mean = sum / field.length;
  const gain =
    DETAIL_STD /
    Math.sqrt(Math.max(sumSquares / field.length - mean * mean, 1e-9));
  for (let index = 0; index < field.length; index++) {
    field[index] = (field[index] - mean) * gain + DETAIL_MEAN;
  }
  return field;
}

function createFbm(
  noise: Float32Array,
  size: number
): (u: number, v: number) => number {
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const sample = (x: number, y: number, frequency: number) =>
    noise[
      (((y % frequency) + frequency) % frequency) * size +
        (((x % frequency) + frequency) % frequency)
    ];
  const octave = (u: number, v: number, frequency: number) => {
    const x = u * frequency;
    const y = v * frequency;
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const uu = smooth(x - xi);
    const vv = smooth(y - yi);
    const a = sample(xi, yi, frequency);
    const b = sample(xi + 1, yi, frequency);
    const c = sample(xi, yi + 1, frequency);
    const d = sample(xi + 1, yi + 1, frequency);
    return (
      a * (1 - uu) * (1 - vv) +
      b * uu * (1 - vv) +
      c * (1 - uu) * vv +
      d * uu * vv
    );
  };
  const raw = (u: number, v: number) => {
    let sum = 0;
    let amplitude = 0.5;
    let frequency = 4;
    for (let index = 0; index < FBM_OCTAVES; index++) {
      sum += amplitude * octave(u, v, frequency);
      amplitude *= FBM_PERSISTENCE;
      frequency *= 2;
    }
    return sum;
  };

  let count = 0;
  let sum = 0;
  let sumSquares = 0;
  for (let y = 0; y < size; y += 4) {
    for (let x = 0; x < size; x += 4) {
      const value = raw(x / size, y / size);
      count += 1;
      sum += value;
      sumSquares += value * value;
    }
  }
  const mean = sum / count;
  const gain =
    DETAIL_STD / Math.sqrt(Math.max(sumSquares / count - mean * mean, 1e-9));
  return (u, v) => (raw(u, v) - mean) * gain + DETAIL_MEAN;
}
