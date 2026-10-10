import { MAX_EXTRAPOLATION, MAX_TILE_SIZE } from "./constants";
import type { WaterSample, WaterSource, WaterSurface } from "./water";

export interface WaterTilePlan {
  originX: number;
  originZ: number;
  spacing: number;
  size: number;
}

export interface WaterTileFrame {
  readonly plan: WaterTilePlan;
  time: number;
  heights: Float32Array;
}

export interface WaterTiles extends WaterSource {
  write(
    id: string,
    plan: WaterTilePlan,
    heights: Float32Array,
    offset: number,
    time: number
  ): void;
  frame(id: string): WaterTileFrame | null;
  remove(id: string): void;
  clear(): void;
}

interface TileRecord {
  current: WaterTileFrame | null;
  previous: WaterTileFrame | null;
}

export function createWaterTilePlan(): WaterTilePlan {
  return { originX: 0, originZ: 0, spacing: 1, size: 0 };
}

export function planWaterTile(
  out: WaterTilePlan,
  x: number,
  z: number,
  radius: number,
  spacing: number
): WaterTilePlan {
  let step = spacing;
  let size = Math.ceil((2 * radius) / step) + 2;
  if (size > MAX_TILE_SIZE) {
    size = MAX_TILE_SIZE;
    step = (2 * radius) / (MAX_TILE_SIZE - 2);
  }
  out.spacing = step;
  out.size = size;
  out.originX = Math.floor((x - radius) / step) * step;
  out.originZ = Math.floor((z - radius) / step) * step;
  return out;
}

export function tilePointCount(plan: WaterTilePlan): number {
  return plan.size * plan.size;
}

export function writeTilePoints(
  plan: WaterTilePlan,
  input: Float32Array,
  offset: number
): void {
  let index = offset * 4;
  for (let j = 0; j < plan.size; j++) {
    const z = plan.originZ + j * plan.spacing;
    for (let i = 0; i < plan.size; i++) {
      input[index] = plan.originX + i * plan.spacing;
      input[index + 1] = z;
      input[index + 2] = plan.spacing;
      input[index + 3] = 0;
      index += 4;
    }
  }
}

export function createWaterTiles(): WaterTiles {
  const records = new Map<string, TileRecord>();
  let active: TileRecord | null = null;
  let now = 0;

  const surface: WaterSurface = {
    sample(x, z, out) {
      sampleRecord(active, now, x, z, out);
    },
  };

  return {
    setTime(time) {
      now = time;
    },

    surface(id) {
      const record = records.get(id);
      if (record === undefined || record.current === null) return null;
      active = record;
      return surface;
    },

    write(id, plan, heights, offset, time) {
      let record = records.get(id);
      if (record === undefined) {
        record = { current: null, previous: null };
        records.set(id, record);
      }
      if (record.current !== null && time < record.current.time) return;
      const frame = reuseFrame(record.previous, plan.size * plan.size);
      Object.assign(frame.plan, plan);
      frame.time = time;
      frame.heights.set(
        heights.subarray(offset, offset + plan.size * plan.size)
      );
      record.previous = record.current;
      record.current = frame;
    },

    frame(id) {
      return records.get(id)?.current ?? null;
    },

    remove(id) {
      if (active === records.get(id)) active = null;
      records.delete(id);
    },

    clear() {
      records.clear();
      active = null;
    },
  };
}

function reuseFrame(
  frame: WaterTileFrame | null,
  length: number
): WaterTileFrame {
  if (frame === null) {
    return {
      plan: { originX: 0, originZ: 0, spacing: 1, size: 0 },
      time: 0,
      heights: new Float32Array(length),
    };
  }
  if (frame.heights.length < length) frame.heights = new Float32Array(length);
  return frame;
}

function sampleRecord(
  record: TileRecord | null,
  now: number,
  x: number,
  z: number,
  out: WaterSample
): void {
  const current = record?.current ?? null;
  if (record === null || current === null) {
    out.height = 0;
    out.verticalVelocity = 0;
    return;
  }
  const height = heightAt(current, x, z);
  const previous = record.previous;
  let rate = 0;
  if (
    previous !== null &&
    current.time > previous.time &&
    contains(previous.plan, x, z)
  ) {
    rate = (height - heightAt(previous, x, z)) / (current.time - previous.time);
  }
  const age = Math.min(
    Math.max(now - current.time, -MAX_EXTRAPOLATION),
    MAX_EXTRAPOLATION
  );
  out.height = height + age * rate;
  out.verticalVelocity = rate;
}

function contains(plan: WaterTilePlan, x: number, z: number): boolean {
  const extent = (plan.size - 1) * plan.spacing;
  return (
    x >= plan.originX &&
    z >= plan.originZ &&
    x <= plan.originX + extent &&
    z <= plan.originZ + extent
  );
}

function heightAt(frame: WaterTileFrame, x: number, z: number): number {
  const { originX, originZ, spacing, size } = frame.plan;
  const fx = Math.min(Math.max((x - originX) / spacing, 0), size - 1);
  const fz = Math.min(Math.max((z - originZ) / spacing, 0), size - 1);
  const i = Math.min(Math.floor(fx), size - 2);
  const j = Math.min(Math.floor(fz), size - 2);
  const u = fx - i;
  const v = fz - j;
  const heights = frame.heights;
  const row = j * size + i;
  const near = heights[row] * (1 - u) + heights[row + 1] * u;
  const far = heights[row + size] * (1 - u) + heights[row + size + 1] * u;
  return near * (1 - v) + far * v;
}
