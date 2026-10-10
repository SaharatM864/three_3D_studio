import type { Vector3 } from "three";

import type { BuoyancySlamming } from "@/model/types";

import type { HullMesh } from "../hull/mesh";
import type { SubmergedSurface } from "./immersion";
import { addForce, type Wrench } from "./wrench";

export interface Slamming {
  apply(
    surface: SubmergedSurface,
    mass: number,
    dt: number,
    center: Vector3,
    out: Wrench
  ): void;
  reset(): void;
}

const MIN_AREA = 1e-12;

export function createSlamming(
  mesh: HullMesh,
  { power, threshold }: BuoyancySlamming
): Slamming {
  const { positions, indices, triangleCount } = mesh;
  const full = new Float64Array(triangleCount);
  let total = 0;
  for (let triangle = 0; triangle < triangleCount; triangle++) {
    const a = indices[triangle * 3] * 3;
    const b = indices[triangle * 3 + 1] * 3;
    const c = indices[triangle * 3 + 2] * 3;
    const ex = positions[b] - positions[a];
    const ey = positions[b + 1] - positions[a + 1];
    const ez = positions[b + 2] - positions[a + 2];
    const fx = positions[c] - positions[a];
    const fy = positions[c + 1] - positions[a + 1];
    const fz = positions[c + 2] - positions[a + 2];
    full[triangle] =
      0.5 * Math.hypot(ey * fz - ez * fy, ez * fx - ex * fz, ex * fy - ey * fx);
    total += full[triangle];
  }
  let previous = new Float64Array(triangleCount);
  let current = new Float64Array(triangleCount);
  let primed = false;

  return {
    apply(surface, mass, dt, center, out) {
      const { sources, areas, centroids, velocities } = surface;
      current.fill(0);
      for (let index = 0; index < surface.count; index++) {
        const offset = index * 3;
        const area = Math.hypot(
          areas[offset],
          areas[offset + 1],
          areas[offset + 2]
        );
        const speed = Math.hypot(
          velocities[offset],
          velocities[offset + 1],
          velocities[offset + 2]
        );
        current[sources[index]] += area * speed;
      }

      if (primed) {
        for (let index = 0; index < surface.count; index++) {
          const offset = index * 3;
          const source = sources[index];
          if (full[source] < MIN_AREA) continue;
          const sx = areas[offset];
          const sy = areas[offset + 1];
          const sz = areas[offset + 2];
          const vx = velocities[offset];
          const vy = velocities[offset + 1];
          const vz = velocities[offset + 2];
          const flux = sx * vx + sy * vy + sz * vz;
          if (flux <= 0) continue;
          const area = Math.hypot(sx, sy, sz);
          const speed = Math.hypot(vx, vy, vz);
          const rate =
            (current[source] - previous[source]) / (full[source] * dt);
          if (rate <= 0) continue;
          const cosine = flux / (area * speed);
          const strength =
            Math.pow(Math.min(rate / threshold, 1), power) *
            cosine *
            ((2 * area) / total) *
            (mass / dt);
          addForce(
            out,
            -strength * vx,
            -strength * vy,
            -strength * vz,
            centroids[offset] - center.x,
            centroids[offset + 1] - center.y,
            centroids[offset + 2] - center.z
          );
        }
      }

      const swap = previous;
      previous = current;
      current = swap;
      primed = true;
    },

    reset() {
      primed = false;
    },
  };
}
