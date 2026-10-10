import type { Object3D } from "three";

import { TILE_LATENCY, TILE_MARGIN } from "@/physics/constants";
import { createFloatingBody } from "@/physics/floating-body";
import {
  createFloatingStepper,
  type FloatingEntry,
} from "@/physics/floating-stepper";
import { createFlatWater, createWaterSample } from "@/physics/water";
import {
  createWaterTilePlan,
  createWaterTiles,
  planWaterTile,
  tilePointCount,
  writeTilePoints,
  type WaterTilePlan,
} from "@/physics/water-tiles";
import type { ResolvedBuoyancy } from "@/presets/buoyancy";

import type {
  OceanHandle,
  OceanHeights,
  OceanHeightsCallback,
} from "../ocean/create-ocean";
import type { Disposable } from "../use-disposable";

export interface BuoyancyDebugData {
  readonly probes: Float32Array;
  probeCount: number;
  readonly points: Float32Array;
  pointCount: number;
}

export interface BuoyancyHandle extends Disposable {
  setOcean(ocean: OceanHandle | null): void;
  add(id: string, buoyancy: ResolvedBuoyancy, target: Object3D): () => void;
  update(delta: number): boolean;
  readDebug(out: BuoyancyDebugData): void;
}

interface Registration extends FloatingEntry {
  readonly target: Object3D;
  readonly plan: WaterTilePlan;
}

interface PendingItem {
  id: string;
  readonly plan: WaterTilePlan;
  offset: number;
}

interface PendingBatch {
  token: number;
  time: number;
  epoch: number;
  count: number;
  readonly items: PendingItem[];
}

const PENDING_BATCHES = 8;
const MAX_FLAT_DELTA = 0.1;

export function createBuoyancy(): BuoyancyHandle {
  const flat = createFlatWater(0);
  const tiles = createWaterTiles();
  const stepper = createFloatingStepper();
  const entries: Registration[] = [];
  const registered = new Map<string, Registration>();
  const pending: readonly PendingBatch[] = Array.from(
    { length: PENDING_BATCHES },
    () => ({ token: -1, time: 0, epoch: -1, count: 0, items: [] })
  );
  const sample = createWaterSample();
  let ocean: OceanHandle | null = null;
  let epoch = -1;
  let lastTime: number | null = null;
  let nextToken = 0;
  let cursor = 0;

  const receive: OceanHeightsCallback = (heights, _count, token) => {
    const batch = pending[token % PENDING_BATCHES];
    if (batch.token !== token || batch.epoch !== epoch) return;
    for (let index = 0; index < batch.count; index++) {
      const item = batch.items[index];
      if (!registered.has(item.id)) continue;
      tiles.write(item.id, item.plan, heights, item.offset, batch.time);
    }
  };

  function resetWater(): void {
    epoch = -1;
    lastTime = null;
    tiles.clear();
    stepper.reset();
  }

  function advanceOcean(handle: OceanHandle): boolean {
    if (!handle.ready) return false;
    if (handle.epoch !== epoch) {
      resetWater();
      epoch = handle.epoch;
    }
    const time = handle.waveTime;
    const dt = lastTime === null ? 0 : time - lastTime;
    lastTime = time;
    const stepped = stepper.advance(entries, dt, time, tiles);
    submitTiles(handle.heights, time);
    return stepped;
  }

  function submitTiles(heights: OceanHeights, time: number): void {
    const token = nextToken;
    const batch = pending[token % PENDING_BATCHES];
    let points = 0;
    let count = 0;
    for (let visited = 0; visited < entries.length; visited++) {
      const entry = entries[(cursor + visited) % entries.length];
      const { position, velocity } = entry.body.state;
      const plan = planWaterTile(
        entry.plan,
        position.x + velocity.x * TILE_LATENCY,
        position.z + velocity.z * TILE_LATENCY,
        entry.body.radius + TILE_MARGIN,
        entry.body.waveFilter
      );
      const size = tilePointCount(plan);
      if (points + size > heights.capacity) break;
      writeTilePoints(plan, heights.input, points);
      if (batch.items.length === count) {
        batch.items.push({ id: "", plan: createWaterTilePlan(), offset: 0 });
      }
      const item = batch.items[count];
      item.id = entry.id;
      Object.assign(item.plan, plan);
      item.offset = points;
      points += size;
      count += 1;
    }
    if (count === 0) return;
    cursor = (cursor + count) % entries.length;
    batch.token = token;
    batch.time = time;
    batch.epoch = epoch;
    batch.count = count;
    if (heights.submit(points, token, receive)) nextToken += 1;
    else batch.token = -1;
  }

  return {
    setOcean(next) {
      if (next === ocean) return;
      ocean = next;
      resetWater();
    },

    add(id, buoyancy, target) {
      const body = createFloatingBody(buoyancy);
      body.reset(target.position, target.quaternion);
      const entry: Registration = {
        id,
        body,
        target,
        plan: createWaterTilePlan(),
      };
      entries.push(entry);
      registered.set(id, entry);
      return () => {
        const index = entries.indexOf(entry);
        if (index >= 0) entries.splice(index, 1);
        if (registered.get(id) !== entry) return;
        registered.delete(id);
        tiles.remove(id);
      };
    },

    update(delta) {
      if (entries.length === 0) return false;
      const stepped =
        ocean === null
          ? stepper.advance(entries, Math.min(delta, MAX_FLAT_DELTA), 0, flat)
          : advanceOcean(ocean);
      if (!stepped) return false;
      let moving = false;
      for (const { body, target } of entries) {
        body.readPose(target.position, target.quaternion);
        if (!body.resting) moving = true;
      }
      return moving;
    },

    readDebug(out) {
      let probes = 0;
      let points = 0;
      for (const { id, body } of entries) {
        const length = Math.min(
          body.probes.length,
          out.probes.length - probes * 4
        );
        out.probes.set(body.probes.subarray(0, length), probes * 4);
        probes += length / 4;

        const frame = tiles.frame(id);
        const surface = tiles.surface(id);
        if (frame === null || surface === null) continue;
        const { originX, originZ, spacing, size } = frame.plan;
        for (let j = 0; j < size; j++) {
          for (let i = 0; i < size; i++) {
            if (points * 3 >= out.points.length) break;
            const x = originX + i * spacing;
            const z = originZ + j * spacing;
            surface.sample(x, z, sample);
            out.points[points * 3] = x;
            out.points[points * 3 + 1] = sample.height;
            out.points[points * 3 + 2] = z;
            points += 1;
          }
        }
      }
      out.probeCount = probes;
      out.pointCount = points;
    },

    dispose() {
      entries.length = 0;
      registered.clear();
      ocean = null;
      resetWater();
    },
  };
}
