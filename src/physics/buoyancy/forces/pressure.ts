import type { Vector3 } from "three";

import { GRAVITY } from "../../constants";
import { WATER_DENSITY } from "../constants";
import type { SubmergedSurface } from "./immersion";
import type { Wrench } from "./wrench";

const WEIGHT = WATER_DENSITY * GRAVITY;

export function applyPressure(
  surface: SubmergedSurface,
  center: Vector3,
  out: Wrench
): number {
  const { vertices, depths, areas } = surface;
  let fx = 0;
  let fy = 0;
  let fz = 0;
  let tx = 0;
  let ty = 0;
  let tz = 0;
  for (let index = 0; index < surface.count; index++) {
    const v = index * 9;
    const d = index * 3;
    const d0 = depths[d];
    const d1 = depths[d + 1];
    const d2 = depths[d + 2];
    const sum = d0 + d1 + d2;
    const sx = areas[d];
    const sy = areas[d + 1];
    const sz = areas[d + 2];
    const scale = (-WEIGHT * sum) / 3;
    fx += scale * sx;
    fy += scale * sy;
    fz += scale * sz;

    const x0 = vertices[v] - center.x;
    const y0 = vertices[v + 1] - center.y;
    const z0 = vertices[v + 2] - center.z;
    const x1 = vertices[v + 3] - center.x;
    const y1 = vertices[v + 4] - center.y;
    const z1 = vertices[v + 5] - center.z;
    const x2 = vertices[v + 6] - center.x;
    const y2 = vertices[v + 7] - center.y;
    const z2 = vertices[v + 8] - center.z;
    const mx =
      (WEIGHT / 12) * (d0 * x0 + d1 * x1 + d2 * x2 + sum * (x0 + x1 + x2));
    const my =
      (WEIGHT / 12) * (d0 * y0 + d1 * y1 + d2 * y2 + sum * (y0 + y1 + y2));
    const mz =
      (WEIGHT / 12) * (d0 * z0 + d1 * z1 + d2 * z2 + sum * (z0 + z1 + z2));
    tx += sy * mz - sz * my;
    ty += sz * mx - sx * mz;
    tz += sx * my - sy * mx;
  }
  out.force.x += fx;
  out.force.y += fy;
  out.force.z += fz;
  out.torque.x += tx;
  out.torque.y += ty;
  out.torque.z += tz;
  return fy / WEIGHT;
}

export function submergedCentroid(
  surface: SubmergedSurface,
  out: Vector3
): number {
  const { vertices, depths, areas } = surface;
  let volume = 0;
  let x = 0;
  let y = 0;
  let z = 0;
  for (let index = 0; index < surface.count; index++) {
    const v = index * 9;
    const d = index * 3;
    const d0 = depths[d];
    const d1 = depths[d + 1];
    const d2 = depths[d + 2];
    const sum = d0 + d1 + d2;
    const sy = areas[d + 1];
    const x0 = vertices[v];
    const y0 = vertices[v + 1];
    const z0 = vertices[v + 2];
    const x1 = vertices[v + 3];
    const y1 = vertices[v + 4];
    const z1 = vertices[v + 5];
    const x2 = vertices[v + 6];
    const y2 = vertices[v + 7];
    const z2 = vertices[v + 8];
    volume -= (sy * sum) / 3;
    x -= (sy / 12) * (d0 * x0 + d1 * x1 + d2 * x2 + sum * (x0 + x1 + x2));
    z -= (sy / 12) * (d0 * z0 + d1 * z1 + d2 * z2 + sum * (z0 + z1 + z2));
    y -=
      (sy / 12) *
      (d0 * y0 +
        d1 * y1 +
        d2 * y2 +
        sum * (y0 + y1 + y2) +
        0.5 * (d0 * d0 + d1 * d1 + d2 * d2 + sum * sum));
  }
  if (volume > 0) out.set(x / volume, y / volume, z / volume);
  else out.set(0, 0, 0);
  return volume;
}
