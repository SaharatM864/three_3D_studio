import { Vector3 } from "three";

import type { HullMesh } from "./mesh";

export interface HullMassProperties {
  readonly volume: number;
  readonly area: number;
  readonly centroid: Vector3;
  readonly gyration: Vector3;
}

const integrals = new Float64Array(7);

export function hullMassProperties(mesh: HullMesh): HullMassProperties {
  const { positions, indices } = mesh;
  integrals.fill(0);
  let area = 0;
  for (let index = 0; index < indices.length; index += 3) {
    const a = indices[index] * 3;
    const b = indices[index + 1] * 3;
    const c = indices[index + 2] * 3;
    const x0 = positions[a];
    const y0 = positions[a + 1];
    const z0 = positions[a + 2];
    const x1 = positions[b];
    const y1 = positions[b + 1];
    const z1 = positions[b + 2];
    const x2 = positions[c];
    const y2 = positions[c + 1];
    const z2 = positions[c + 2];
    const ex = x1 - x0;
    const ey = y1 - y0;
    const ez = z1 - z0;
    const fx = x2 - x0;
    const fy = y2 - y0;
    const fz = z2 - z0;
    const dx = ey * fz - ez * fy;
    const dy = ez * fx - ex * fz;
    const dz = ex * fy - ey * fx;
    area += 0.5 * Math.hypot(dx, dy, dz);

    const qx = quadratic(x0, x1, x2);
    const qy = quadratic(y0, y1, y2);
    const qz = quadratic(z0, z1, z2);
    integrals[0] += dx * (x0 + x1 + x2);
    integrals[1] += dx * qx;
    integrals[2] += dy * qy;
    integrals[3] += dz * qz;
    integrals[4] += dx * cubic(x0, x1, x2);
    integrals[5] += dy * cubic(y0, y1, y2);
    integrals[6] += dz * cubic(z0, z1, z2);
  }

  const volume = integrals[0] / 6;
  const centroid = new Vector3(
    integrals[1] / 24,
    integrals[2] / 24,
    integrals[3] / 24
  ).divideScalar(volume);
  const xx = integrals[4] / 60 - volume * centroid.x * centroid.x;
  const yy = integrals[5] / 60 - volume * centroid.y * centroid.y;
  const zz = integrals[6] / 60 - volume * centroid.z * centroid.z;
  const gyration = new Vector3(
    Math.sqrt((yy + zz) / volume),
    Math.sqrt((xx + zz) / volume),
    Math.sqrt((xx + yy) / volume)
  );
  return { volume, area, centroid, gyration };
}

function quadratic(w0: number, w1: number, w2: number): number {
  return w0 * w0 + w1 * (w0 + w1) + w2 * (w0 + w1 + w2);
}

function cubic(w0: number, w1: number, w2: number): number {
  const square = w0 * w0;
  const pair = square + w1 * (w0 + w1);
  return w0 * square + w1 * pair + w2 * (pair + w2 * (w0 + w1 + w2));
}
