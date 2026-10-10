import type { Vector3 } from "three";

import type { HullShape, Vec2, Vec3 } from "@/model/types";

import { GRAVITY } from "../constants";
import { solidInertia } from "../dynamics/mass";
import { WATER_DENSITY } from "./constants";

export interface HullColumn {
  readonly x: number;
  readonly z: number;
  readonly bottom: number;
  readonly top: number;
  readonly area: number;
  readonly volume: number;
}

export interface Hull {
  readonly shape: HullShape;
  readonly size: Vec3;
  readonly columns: readonly HullColumn[];
  readonly volume: number;
}

export interface HullStiffness {
  heave: number;
  roll: number;
  pitch: number;
}

interface ColumnSection {
  bottom: number;
  top: number;
}

const SUBSAMPLES = 4;
const WATERLINE_ITERATIONS = 48;
const OUTLINE_SAMPLES = 32;

const BOAT_WATERPLANE: readonly Vec2[] = [
  [-1, 0.82],
  [-0.3, 1],
  [0.25, 0.9],
  [0.7, 0.5],
  [1, 0],
];
const BOAT_DEADRISE = 0.15;
const BOAT_ROCKER = 0.35;
const BOAT_ROCKER_START = 0.3;

const section: ColumnSection = { bottom: 0, top: 0 };

export function createHull(
  shape: HullShape,
  size: Vec3,
  [across, along]: Vec2
): Hull {
  const [beam, height, length] = size;
  const cellX = beam / across;
  const cellZ = length / along;
  const subArea = (cellX * cellZ) / (SUBSAMPLES * SUBSAMPLES);
  const columns: HullColumn[] = [];
  let volume = 0;

  for (let j = 0; j < along; j++) {
    for (let i = 0; i < across; i++) {
      let area = 0;
      let x = 0;
      let z = 0;
      let bottom = 0;
      let top = 0;
      for (let sj = 0; sj < SUBSAMPLES; sj++) {
        for (let si = 0; si < SUBSAMPLES; si++) {
          const u = -1 + (2 * (i + (si + 0.5) / SUBSAMPLES)) / across;
          const w = -1 + (2 * (j + (sj + 0.5) / SUBSAMPLES)) / along;
          if (!sectionAt(shape, u, w, section)) continue;
          area += subArea;
          x += u * subArea;
          z += w * subArea;
          bottom += section.bottom * subArea;
          top += section.top * subArea;
        }
      }
      if (area === 0) continue;
      const column: HullColumn = {
        x: ((x / area) * beam) / 2,
        z: ((z / area) * length) / 2,
        bottom: (bottom / area) * height,
        top: (top / area) * height,
        area,
        volume: (top - bottom) * height,
      };
      columns.push(column);
      volume += column.volume;
    }
  }

  return { shape, size, columns, volume };
}

export function hullPoints(shape: HullShape, size: Vec3): Float32Array {
  const [beam, height, length] = size;
  const points: number[] = [];
  for (let j = 0; j < OUTLINE_SAMPLES; j++) {
    for (let i = 0; i < OUTLINE_SAMPLES; i++) {
      const u = -1 + (2 * i) / (OUTLINE_SAMPLES - 1);
      const w = -1 + (2 * j) / (OUTLINE_SAMPLES - 1);
      if (!sectionAt(shape, u, w, section)) continue;
      const x = (u * beam) / 2;
      const z = (w * length) / 2;
      points.push(x, section.bottom * height, z, x, section.top * height, z);
    }
  }
  return new Float32Array(points);
}

function sectionAt(
  shape: HullShape,
  u: number,
  w: number,
  out: ColumnSection
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
      const rocker = Math.max(
        0,
        (w - BOAT_ROCKER_START) / (1 - BOAT_ROCKER_START)
      );
      out.bottom +=
        (BOAT_DEADRISE * Math.abs(u)) / halfBeam +
        BOAT_ROCKER * rocker * rocker;
      return out.bottom < out.top;
    }
  }
}

function boatHalfBeam(w: number): number {
  for (let index = 1; index < BOAT_WATERPLANE.length; index++) {
    const [w1, b1] = BOAT_WATERPLANE[index];
    if (w <= w1) {
      const [w0, b0] = BOAT_WATERPLANE[index - 1];
      return b0 + ((b1 - b0) * (w - w0)) / (w1 - w0);
    }
  }
  return 0;
}

export function hullInertia(
  shape: HullShape,
  size: Vec3,
  mass: number,
  addedInertia: number
): Vector3 {
  const inertia = solidInertia(shape === "boat" ? "box" : shape, size, mass);
  inertia.x *= addedInertia;
  inertia.z *= addedInertia;
  return inertia;
}

export function submergedVolume(hull: Hull, level: number): number {
  let volume = 0;
  for (const column of hull.columns) {
    volume += column.area * columnDepth(column, level);
  }
  return volume;
}

export function solveWaterline(hull: Hull, displaced: number): number {
  let low = Infinity;
  let high = -Infinity;
  for (const column of hull.columns) {
    low = Math.min(low, column.bottom);
    high = Math.max(high, column.top);
  }
  if (displaced >= hull.volume) return high;
  for (let iteration = 0; iteration < WATERLINE_ITERATIONS; iteration++) {
    const level = (low + high) / 2;
    if (submergedVolume(hull, level) < displaced) low = level;
    else high = level;
  }
  return (low + high) / 2;
}

export function hydrostaticStiffness(
  hull: Hull,
  level: number,
  [comX, comY, comZ]: Vec3
): HullStiffness {
  let waterplane = 0;
  let rollArm = 0;
  let pitchArm = 0;
  let displaced = 0;
  let buoyancyHeight = 0;
  for (const column of hull.columns) {
    const depth = columnDepth(column, level);
    displaced += column.area * depth;
    buoyancyHeight += column.area * depth * (column.bottom + depth / 2);
    if (level <= column.bottom || level >= column.top) continue;
    waterplane += column.area;
    rollArm += column.area * (column.x - comX) ** 2;
    pitchArm += column.area * (column.z - comZ) ** 2;
  }
  const righting =
    displaced > 0 ? displaced * (buoyancyHeight / displaced - comY) : 0;
  const weight = WATER_DENSITY * GRAVITY;
  return {
    heave: weight * waterplane,
    roll: Math.max(weight * (rollArm + righting), 0),
    pitch: Math.max(weight * (pitchArm + righting), 0),
  };
}

function columnDepth(column: HullColumn, level: number): number {
  return Math.min(
    Math.max(level - column.bottom, 0),
    column.top - column.bottom
  );
}
