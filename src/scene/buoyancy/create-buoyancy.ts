import { Vector3, type Object3D } from "three";

import {
  MAX_ANGULAR_SPEED,
  TILE_LATENCY,
  TILE_MARGIN,
} from "@/physics/buoyancy/constants";
import {
  createFloatingBody,
  type FloatingBody,
  type FloatingBodyDebug,
} from "@/physics/buoyancy/floating-body";
import { submergedCentroid } from "@/physics/buoyancy/forces/pressure";
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

export const DebugLine = {
  wetted: 0,
  waterline: 1,
  buoyancy: 2,
  hydrodynamic: 3,
} as const;

export const DebugMarker = {
  mass: 0,
  buoyancy: 1,
} as const;

export interface BuoyancyDebugData {
  readonly lines: Float32Array;
  readonly lineKinds: Uint8Array;
  lineCount: number;
  readonly markers: Float32Array;
  readonly markerKinds: Uint8Array;
  markerCount: number;
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
const FORCE_LENGTH = 1.5;

const buoyancyCenter = new Vector3();

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
    for (const entry of entries) entry.floating.reset();
  }

  function hold(entry: Registration, body: RigidBody): void {
    if (entry.held) return;
    entry.held = true;
    entry.floating.reset();
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
        entry.floating.applyForces(dynamic, surface, step.dt);
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
      out.lineCount = 0;
      out.markerCount = 0;
      out.pointCount = 0;
      for (const { id, floating } of entries) {
        if (floating.debug.ready) writeHull(out, floating.debug);
        const frame = tiles.frame(id);
        const water = tiles.surface(id);
        if (frame === null || water === null) continue;
        const { originX, originZ, spacing, size } = frame.plan;
        for (let j = 0; j < size; j++) {
          for (let i = 0; i < size; i++) {
            if (out.pointCount * 3 >= out.points.length) break;
            const x = originX + i * spacing;
            const z = originZ + j * spacing;
            water.sample(x, z, sample);
            const offset = out.pointCount * 3;
            out.points[offset] = x;
            out.points[offset + 1] = sample.height;
            out.points[offset + 2] = z;
            out.pointCount += 1;
          }
        }
      }
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

function writeHull(out: BuoyancyDebugData, debug: FloatingBodyDebug): void {
  const { surface, hydrostatic, hydrodynamic, centerOfMass, weight } = debug;
  const { vertices, waterline } = surface;
  for (let index = 0; index < surface.count; index++) {
    for (let edge = 0; edge < 3; edge++) {
      const from = index * 9 + edge * 3;
      const to = index * 9 + ((edge + 1) % 3) * 3;
      writeLine(
        out,
        DebugLine.wetted,
        vertices[from],
        vertices[from + 1],
        vertices[from + 2],
        vertices[to],
        vertices[to + 1],
        vertices[to + 2]
      );
    }
  }
  for (let index = 0; index < surface.waterlineCount; index++) {
    const offset = index * 6;
    writeLine(
      out,
      DebugLine.waterline,
      waterline[offset],
      waterline[offset + 1],
      waterline[offset + 2],
      waterline[offset + 3],
      waterline[offset + 4],
      waterline[offset + 5]
    );
  }
  writeMarker(out, DebugMarker.mass, centerOfMass);
  writeForce(
    out,
    DebugLine.hydrodynamic,
    centerOfMass,
    hydrodynamic.force,
    weight
  );
  if (submergedCentroid(surface, buoyancyCenter) <= 0) return;
  writeMarker(out, DebugMarker.buoyancy, buoyancyCenter);
  writeForce(
    out,
    DebugLine.buoyancy,
    buoyancyCenter,
    hydrostatic.force,
    weight
  );
}

function writeLine(
  out: BuoyancyDebugData,
  kind: number,
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number
): void {
  if ((out.lineCount + 1) * 6 > out.lines.length) return;
  const offset = out.lineCount * 6;
  out.lines[offset] = ax;
  out.lines[offset + 1] = ay;
  out.lines[offset + 2] = az;
  out.lines[offset + 3] = bx;
  out.lines[offset + 4] = by;
  out.lines[offset + 5] = bz;
  out.lineKinds[out.lineCount] = kind;
  out.lineCount += 1;
}

function writeMarker(
  out: BuoyancyDebugData,
  kind: number,
  point: Vector3
): void {
  if ((out.markerCount + 1) * 3 > out.markers.length) return;
  point.toArray(out.markers, out.markerCount * 3);
  out.markerKinds[out.markerCount] = kind;
  out.markerCount += 1;
}

function writeForce(
  out: BuoyancyDebugData,
  kind: number,
  origin: Vector3,
  force: Vector3,
  weight: number
): void {
  const scale = FORCE_LENGTH / weight;
  writeLine(
    out,
    kind,
    origin.x,
    origin.y,
    origin.z,
    origin.x + force.x * scale,
    origin.y + force.y * scale,
    origin.z + force.z * scale
  );
}
