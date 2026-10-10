import { Vector3, type Object3D } from "three";

import {
  MAX_ANGULAR_SPEED,
  TILE_LATENCY,
  TILE_MARGIN,
} from "@/physics/buoyancy/constants";
import {
  createFloatingBody,
  type FloatingBody,
} from "@/physics/buoyancy/floating-body";
import {
  createFlatWater,
  createWaterSample,
  type WaterSource,
} from "@/physics/buoyancy/water";
import {
  createWaterTilePlan,
  createWaterTiles,
  planWaterTile,
  tilePointCount,
  writeTilePoints,
  type WaterTilePlan,
} from "@/physics/buoyancy/water-tiles";
import type { RigidBody } from "@/physics/rapier";
import type { ColliderGeometry } from "@/physics/shapes";
import type { PhysicsSystem, PhysicsWorld } from "@/physics/world";
import type { ResolvedBuoyancy } from "@/presets/buoyancy";
import type { ResolvedPhysics } from "@/presets/physics";

import type {
  OceanHandle,
  OceanHeights,
  OceanHeightsCallback,
} from "../ocean/create-ocean";
import type { PhysicsHandle } from "../physics/create-physics";
import type { Disposable } from "../use-disposable";

export interface BuoyancyDebugData {
  readonly probes: Float32Array;
  probeCount: number;
  readonly points: Float32Array;
  pointCount: number;
}

export interface FloatingObjectInit {
  readonly id: string;
  readonly buoyancy: ResolvedBuoyancy;
  readonly physics: ResolvedPhysics;
  readonly geometry: ColliderGeometry | null;
  readonly target: Object3D;
}

export interface BuoyancyHandle extends Disposable {
  setOcean(ocean: OceanHandle | null): void;
  add(init: FloatingObjectInit): () => void;
  readDebug(out: BuoyancyDebugData): void;
}

interface Registration {
  readonly id: string;
  readonly floating: FloatingBody;
  readonly plan: WaterTilePlan;
  held: boolean;
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

export function createBuoyancy(physics: PhysicsHandle): BuoyancyHandle {
  const flat = createFlatWater(0);
  const tiles = createWaterTiles();
  const entries: Registration[] = [];
  const registered = new Map<string, Registration>();
  const pending: readonly PendingBatch[] = Array.from(
    { length: PENDING_BATCHES },
    () => ({ token: -1, time: 0, epoch: -1, count: 0, items: [] })
  );
  const sample = createWaterSample();
  const position = new Vector3();
  const velocity = new Vector3();
  let ocean: OceanHandle | null = null;
  let water: WaterSource = flat;
  let available = true;
  let epoch = -1;
  let lastTime: number | null = null;
  let frameTime = 0;
  let waveRate = 0;
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
  }

  function hold(entry: Registration, body: RigidBody): void {
    if (entry.held) return;
    entry.held = true;
    body.setEnabled(false);
  }

  function release(entry: Registration, body: RigidBody): void {
    if (!entry.held) return;
    entry.held = false;
    body.setEnabled(true);
  }

  function submitTiles(
    world: PhysicsWorld,
    heights: OceanHeights,
    time: number
  ): void {
    const token = nextToken;
    const batch = pending[token % PENDING_BATCHES];
    let points = 0;
    let count = 0;
    for (let visited = 0; visited < entries.length; visited++) {
      const entry = entries[(cursor + visited) % entries.length];
      const body = world.body(entry.id);
      if (body === null) continue;
      body.worldCom(position);
      body.linvel(velocity);
      const plan = planWaterTile(
        entry.plan,
        position.x + velocity.x * TILE_LATENCY,
        position.z + velocity.z * TILE_LATENCY,
        entry.floating.radius + TILE_MARGIN,
        entry.floating.waveFilter
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

  const system: PhysicsSystem = {
    beforeFrame(frame) {
      if (ocean === null) {
        water = flat;
        available = true;
        return;
      }
      water = tiles;
      available = ocean.ready;
      if (!available) return;
      if (ocean.epoch !== epoch) {
        resetWater();
        epoch = ocean.epoch;
      }
      const time = ocean.waveTime;
      const start = lastTime ?? time;
      lastTime = time;
      frameTime = time;
      waveRate = frame.delta > 0 ? (time - start) / frame.delta : 0;
    },

    beforeStep(step) {
      water.setTime(frameTime - step.lag * waveRate);
      for (const entry of entries) {
        const body = step.world.body(entry.id);
        const dynamic = step.world.dynamicBody(entry.id);
        if (body === null || dynamic === null) continue;
        const surface = available ? water.surface(entry.id) : null;
        if (surface === null) {
          hold(entry, body);
          continue;
        }
        release(entry, body);
        entry.floating.applyForces(dynamic, surface);
      }
    },

    afterFrame(frame) {
      if (ocean === null || !available || frame.steps === 0) return;
      submitTiles(frame.world, ocean.heights, frameTime);
    },
  };
  const removeSystem = physics.world.addSystem(system);

  return {
    setOcean(next) {
      if (next === ocean) return;
      ocean = next;
      resetWater();
    },

    add({ id, buoyancy, physics: resolved, geometry, target }) {
      const floating = createFloatingBody(buoyancy);
      const remove = physics.add({
        id,
        physics: resolved,
        geometry: geometry ?? floating.collider,
        target,
        mass: floating.mass,
        canSleep: false,
        maxAngularSpeed: MAX_ANGULAR_SPEED,
      });
      const entry: Registration = {
        id,
        floating,
        plan: createWaterTilePlan(),
        held: false,
      };
      const index = entries.findIndex((other) => other.id > id);
      entries.splice(index < 0 ? entries.length : index, 0, entry);
      registered.set(id, entry);
      return () => {
        remove();
        const slot = entries.indexOf(entry);
        if (slot >= 0) entries.splice(slot, 1);
        if (registered.get(id) !== entry) return;
        registered.delete(id);
        tiles.remove(id);
      };
    },

    readDebug(out) {
      let probes = 0;
      let points = 0;
      for (const { id, floating } of entries) {
        const length = Math.min(
          floating.probes.length,
          out.probes.length - probes * 4
        );
        out.probes.set(floating.probes.subarray(0, length), probes * 4);
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
      removeSystem();
      entries.length = 0;
      registered.clear();
      ocean = null;
      resetWater();
    },
  };
}
