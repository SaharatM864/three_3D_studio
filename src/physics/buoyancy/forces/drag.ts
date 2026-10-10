import type { Vector3 } from "three";

import type { BuoyancyDrag } from "@/model/types";

import { GRAVITY } from "../../constants";
import { HALF_DENSITY, WATER_DENSITY, WATER_VISCOSITY } from "../constants";
import type { SubmergedSurface } from "./immersion";
import { addForce, type Wrench } from "./wrench";

const MIN_REYNOLDS = 1e5;
const MIN_AREA = 1e-12;
const MIN_SPEED_SQUARED = 1e-12;
const WEIGHT = WATER_DENSITY * GRAVITY;

export function frictionCoefficient(speed: number, length: number): number {
  const reynolds = Math.max((speed * length) / WATER_VISCOSITY, MIN_REYNOLDS);
  return 0.075 / (Math.log10(reynolds) - 2) ** 2;
}

export function applyDrag(
  surface: SubmergedSurface,
  drag: BuoyancyDrag,
  friction: number,
  center: Vector3,
  out: Wrench
): void {
  const { areas, centroids, velocities, depths } = surface;
  const [pressureFalloff, suctionFalloff] = drag.falloff;
  for (let index = 0; index < surface.count; index++) {
    const offset = index * 3;
    const sx = areas[offset];
    const sy = areas[offset + 1];
    const sz = areas[offset + 2];
    const area = Math.hypot(sx, sy, sz);
    if (area < MIN_AREA) continue;
    const vx = velocities[offset];
    const vy = velocities[offset + 1];
    const vz = velocities[offset + 2];
    const speedSquared = vx * vx + vy * vy + vz * vz;
    if (speedSquared < MIN_SPEED_SQUARED) continue;
    const nx = sx / area;
    const ny = sy / area;
    const nz = sz / area;
    const normal = vx * nx + vy * ny + vz * nz;
    const tx = vx - normal * nx;
    const ty = vy - normal * ny;
    const tz = vz - normal * nz;
    const viscous =
      -HALF_DENSITY * friction * area * Math.sqrt(tx * tx + ty * ty + tz * tz);

    const cosine = normal / Math.sqrt(speedSquared);
    let pressure = 0;
    if (cosine > 0) {
      pressure =
        -HALF_DENSITY *
        drag.pressure *
        speedSquared *
        Math.pow(cosine, pressureFalloff);
    } else if (cosine < 0) {
      const depth =
        (depths[offset] + depths[offset + 1] + depths[offset + 2]) / 3;
      pressure = Math.min(
        HALF_DENSITY *
          drag.suction *
          speedSquared *
          Math.pow(-cosine, suctionFalloff),
        WEIGHT * depth
      );
    }
    pressure *= area;

    addForce(
      out,
      viscous * tx + pressure * nx,
      viscous * ty + pressure * ny,
      viscous * tz + pressure * nz,
      centroids[offset] - center.x,
      centroids[offset + 1] - center.y,
      centroids[offset + 2] - center.z
    );
  }
}
