import type { HullShape, Vec2 } from "@/model/types";

export interface HullSection {
  bottom: number;
  top: number;
}

const BOAT_WATERPLANE: readonly Vec2[] = [
  [-1, 0.82],
  [-0.3, 1],
  [0.25, 0.9],
  [0.7, 0.5],
  [1, 0],
];

export const BOAT_DEADRISE = 0.15;
const BOAT_ROCKER = 0.35;
const BOAT_ROCKER_START = 0.3;

export function boatHalfBeam(w: number): number {
  for (let index = 1; index < BOAT_WATERPLANE.length; index++) {
    const [w1, b1] = BOAT_WATERPLANE[index];
    if (w <= w1) {
      const [w0, b0] = BOAT_WATERPLANE[index - 1];
      return Math.max(b0 + ((b1 - b0) * (w - w0)) / (w1 - w0), 0);
    }
  }
  return 0;
}

export function boatKeel(w: number): number {
  const rocker = Math.max(0, (w - BOAT_ROCKER_START) / (1 - BOAT_ROCKER_START));
  return -0.5 + BOAT_ROCKER * rocker * rocker;
}

export function hullSection(
  shape: HullShape,
  u: number,
  w: number,
  out: HullSection
): boolean {
  out.bottom = -0.5;
  out.top = 0.5;
  switch (shape) {
    case "box":
      return true;
    case "cylinder":
      return u * u + w * w <= 1;
    case "ellipsoid": {
      const radial = u * u + w * w;
      if (radial >= 1) return false;
      const half = 0.5 * Math.sqrt(1 - radial);
      out.bottom = -half;
      out.top = half;
      return true;
    }
    case "boat": {
      const halfBeam = boatHalfBeam(w);
      if (Math.abs(u) >= halfBeam) return false;
      out.bottom = boatKeel(w) + (BOAT_DEADRISE * Math.abs(u)) / halfBeam;
      return out.bottom < out.top;
    }
  }
}
