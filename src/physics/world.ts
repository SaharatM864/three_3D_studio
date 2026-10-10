import { Quaternion, Vector3 } from "three";

import type { CollisionLayer, PhysicsBodyType } from "@/model/types";
import type { ResolvedPhysics } from "@/presets/physics";

import { GRAVITY, PHYSICS_STEP, REST_SPEED } from "./constants";
import {
  createDynamicBody,
  type DynamicBody,
  type ManagedDynamicBody,
} from "./dynamics/dynamic-body";
import type { BodyMass } from "./dynamics/mass";
import { collisionGroups } from "./layers";
import type {
  Collider,
  DebugRenderBuffers,
  EventQueue,
  Rapier,
  RigidBody,
  World,
} from "./rapier";
import {
  createBodyDesc,
  createColliderDesc,
  type ColliderGeometry,
} from "./shapes";

export interface PhysicsBodyInit {
  readonly id: string;
  readonly physics: ResolvedPhysics;
  readonly geometry: ColliderGeometry;
  readonly position: Vector3;
  readonly quaternion: Quaternion;
  readonly mass?: BodyMass;
  readonly canSleep?: boolean;
  readonly maxAngularSpeed?: number;
}

export interface FrameContext {
  readonly world: PhysicsWorld;
  readonly delta: number;
  readonly steps: number;
}

export interface StepContext {
  readonly world: PhysicsWorld;
  readonly dt: number;
  readonly index: number;
  readonly count: number;
  readonly lag: number;
}

export interface PhysicsSystem {
  beforeFrame?(frame: FrameContext): void;
  beforeStep?(step: StepContext): void;
  afterStep?(step: StepContext): void;
  afterFrame?(frame: FrameContext): void;
}

export interface FrameTiming {
  readonly delta: number;
  readonly residual: number;
}

export interface ContactEvent {
  readonly a: string;
  readonly b: string;
  readonly started: boolean;
  readonly sensor: boolean;
}

export type ContactListener = (event: ContactEvent) => void;

export interface RayOptions {
  readonly layer?: CollisionLayer;
  readonly exclude?: string;
  readonly includeSensors?: boolean;
}

export interface RayHit {
  id: string;
  distance: number;
  readonly point: Vector3;
  readonly normal: Vector3;
}

export interface PhysicsWorld {
  readonly rapier: Rapier;
  readonly raw: World;
  readonly timestep: number;
  readonly stepCount: number;
  add(init: PhysicsBodyInit): () => void;
  body(id: string): RigidBody | null;
  dynamicBody(id: string): DynamicBody | null;
  idOf(collider: Collider): string | null;
  setTarget(id: string, position: Vector3, quaternion: Quaternion): void;
  addSystem(system: PhysicsSystem): () => void;
  onContact(listener: ContactListener): () => void;
  castRay(
    origin: Vector3,
    direction: Vector3,
    maxDistance: number,
    out: RayHit,
    options?: RayOptions
  ): boolean;
  advance(steps: number, timing: FrameTiming): void;
  readPose(
    id: string,
    alpha: number,
    position: Vector3,
    quaternion: Quaternion
  ): boolean;
  isMoving(): boolean;
  debugRender(): DebugRenderBuffers;
  dispose(): void;
}

interface Entry {
  readonly id: string;
  readonly init: PhysicsBodyInit;
  readonly type: PhysicsBodyType;
  body: RigidBody | null;
  dynamic: ManagedDynamicBody | null;
  readonly previousPosition: Vector3;
  readonly previousQuaternion: Quaternion;
  readonly currentPosition: Vector3;
  readonly currentQuaternion: Quaternion;
  readonly fromPosition: Vector3;
  readonly fromQuaternion: Quaternion;
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

const IDENTITY = { x: 0, y: 0, z: 0, w: 1 };
const REST_SPEED_SQ = REST_SPEED * REST_SPEED;

const velocity = new Vector3();
const spin = new Vector3();
const blendPosition = new Vector3();
const blendQuaternion = new Quaternion();

export function createPhysicsWorld(
  rapier: Rapier,
  timestep = PHYSICS_STEP
): PhysicsWorld {
  const raw = new rapier.World({ x: 0, y: -GRAVITY, z: 0 });
  raw.timestep = timestep;
  const queue: EventQueue = new rapier.EventQueue(true);
  const ray = new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 });
  const entries = new Map<string, Entry>();
  const active: Entry[] = [];
  const pendingAdds: Entry[] = [];
  const pendingRemovals: Entry[] = [];
  const colliderIds = new Map<number, string>();
  const systems: PhysicsSystem[] = [];
  const listeners: ContactListener[] = [];
  const contact: Mutable<ContactEvent> = {
    a: "",
    b: "",
    started: false,
    sensor: false,
  };
  let stepCount = 0;
  let targetsMoving = false;
  let disposed = false;

  function createEntry(init: PhysicsBodyInit): Entry {
    return {
      id: init.id,
      init,
      type: init.physics.body,
      body: null,
      dynamic: null,
      previousPosition: init.position.clone(),
      previousQuaternion: init.quaternion.clone(),
      currentPosition: init.position.clone(),
      currentQuaternion: init.quaternion.clone(),
      fromPosition: init.position.clone(),
      fromQuaternion: init.quaternion.clone(),
    };
  }

  function createBody(entry: Entry): void {
    const { init } = entry;
    const body = raw.createRigidBody(
      createBodyDesc(
        rapier,
        init.physics,
        entry.currentPosition,
        entry.currentQuaternion,
        init.canSleep ?? true
      )
    );
    const collider = raw.createCollider(
      createColliderDesc(
        rapier,
        init.geometry,
        init.physics,
        init.mass !== undefined
      ),
      body
    );
    if (init.mass !== undefined) {
      body.setAdditionalMassProperties(
        init.mass.mass,
        init.mass.centerOfMass,
        init.mass.inertia,
        IDENTITY,
        true
      );
    }
    colliderIds.set(collider.handle, entry.id);
    entry.body = body;
    entry.dynamic =
      entry.type === "dynamic" ? createDynamicBody(entry.id, body) : null;
    entry.previousPosition.copy(entry.currentPosition);
    entry.previousQuaternion.copy(entry.currentQuaternion);
  }

  function destroyBody(entry: Entry): void {
    const body = entry.body;
    if (body === null) return;
    for (let index = 0; index < body.numColliders(); index++) {
      colliderIds.delete(body.collider(index).handle);
    }
    raw.removeRigidBody(body);
    entry.body = null;
    entry.dynamic = null;
  }

  function flush(): void {
    if (pendingRemovals.length > 0) {
      pendingRemovals.sort(byId);
      for (const entry of pendingRemovals) {
        destroyBody(entry);
        const index = active.indexOf(entry);
        if (index >= 0) active.splice(index, 1);
      }
      pendingRemovals.length = 0;
    }
    if (pendingAdds.length > 0) {
      pendingAdds.sort(byId);
      for (const entry of pendingAdds) {
        createBody(entry);
        active.push(entry);
      }
      pendingAdds.length = 0;
      active.sort(byId);
    }
  }

  function driveKinematic(index: number, count: number): void {
    const t = (index + 1) / count;
    for (const entry of active) {
      if (entry.type !== "kinematic" || entry.body === null) continue;
      if (index === 0) {
        entry.fromPosition.copy(entry.body.translation(blendPosition));
        entry.fromQuaternion.copy(entry.body.rotation(blendQuaternion));
      }
      entry.body.setNextKinematicTranslation(
        blendPosition.lerpVectors(entry.fromPosition, entry.currentPosition, t)
      );
      entry.body.setNextKinematicRotation(
        blendQuaternion.slerpQuaternions(
          entry.fromQuaternion,
          entry.currentQuaternion,
          t
        )
      );
    }
  }

  function beginForces(): void {
    for (const entry of active) entry.dynamic?.beginStep();
  }

  function commitForces(): void {
    for (const entry of active) entry.dynamic?.commit();
  }

  function limitSpin(): void {
    for (const entry of active) {
      const limit = entry.init.maxAngularSpeed;
      const body = entry.body;
      if (limit === undefined || body === null || !body.isEnabled()) continue;
      body.angvel(spin);
      if (spin.lengthSq() <= limit * limit) continue;
      body.setAngvel(spin.setLength(limit), false);
    }
  }

  function capture(): void {
    for (const entry of active) {
      if (entry.type !== "dynamic" || entry.body === null) continue;
      entry.previousPosition.copy(entry.currentPosition);
      entry.previousQuaternion.copy(entry.currentQuaternion);
      entry.body.translation(entry.currentPosition);
      entry.body.rotation(entry.currentQuaternion);
    }
  }

  function drainContacts(): void {
    if (listeners.length === 0) return;
    queue.drainCollisionEvents((first, second, started) => {
      const a = colliderIds.get(first);
      const b = colliderIds.get(second);
      if (a === undefined || b === undefined) return;
      contact.a = a;
      contact.b = b;
      contact.started = started;
      contact.sensor =
        raw.getCollider(first).isSensor() || raw.getCollider(second).isSensor();
      for (const listener of listeners) listener(contact);
    });
  }

  const world: PhysicsWorld = {
    rapier,
    raw,
    timestep,

    get stepCount() {
      return stepCount;
    },

    add(init) {
      if (entries.has(init.id)) {
        throw new Error(`Duplicate physics body id "${init.id}"`);
      }
      const entry = createEntry(init);
      entries.set(init.id, entry);
      pendingAdds.push(entry);
      let removed = false;
      return () => {
        if (removed || disposed) return;
        removed = true;
        if (entries.get(entry.id) === entry) entries.delete(entry.id);
        const pending = pendingAdds.indexOf(entry);
        if (pending >= 0) pendingAdds.splice(pending, 1);
        else pendingRemovals.push(entry);
      };
    },

    body(id) {
      return entries.get(id)?.body ?? null;
    },

    dynamicBody(id) {
      return entries.get(id)?.dynamic ?? null;
    },

    idOf(collider) {
      return colliderIds.get(collider.handle) ?? null;
    },

    setTarget(id, position, quaternion) {
      const entry = entries.get(id);
      if (entry === undefined || entry.type === "dynamic") return;
      if (
        entry.currentPosition.equals(position) &&
        entry.currentQuaternion.equals(quaternion)
      ) {
        return;
      }
      entry.currentPosition.copy(position);
      entry.currentQuaternion.copy(quaternion);
      if (entry.body === null) return;
      if (entry.type === "kinematic") {
        targetsMoving = true;
        return;
      }
      entry.body.setTranslation(position, true);
      entry.body.setRotation(quaternion, true);
    },

    addSystem(system) {
      systems.push(system);
      return () => {
        const index = systems.indexOf(system);
        if (index >= 0) systems.splice(index, 1);
      };
    },

    onContact(listener) {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
      };
    },

    castRay(origin, direction, maxDistance, out, options = {}) {
      ray.origin = origin;
      ray.dir = blendPosition.copy(direction).normalize();
      const exclude =
        options.exclude === undefined
          ? undefined
          : (entries.get(options.exclude)?.body ?? undefined);
      const hit = raw.castRayAndGetNormal(
        ray,
        maxDistance,
        true,
        options.includeSensors
          ? undefined
          : rapier.QueryFilterFlags.EXCLUDE_SENSORS,
        options.layer === undefined
          ? undefined
          : collisionGroups(options.layer),
        undefined,
        exclude
      );
      if (hit === null) return false;
      const id = colliderIds.get(hit.collider.handle);
      if (id === undefined) return false;
      out.id = id;
      out.distance = hit.timeOfImpact;
      out.point.copy(origin).addScaledVector(blendPosition, hit.timeOfImpact);
      out.normal.set(hit.normal.x, hit.normal.y, hit.normal.z);
      return true;
    },

    advance(steps, timing) {
      frame.delta = timing.delta;
      frame.steps = steps;
      step.count = steps;
      for (const system of systems) system.beforeFrame?.(frame);
      for (let index = 0; index < steps; index++) {
        flush();
        step.index = index;
        step.lag = timing.residual + (steps - 1 - index) * timestep;
        beginForces();
        for (const system of systems) system.beforeStep?.(step);
        commitForces();
        driveKinematic(index, steps);
        raw.step(queue);
        limitSpin();
        capture();
        for (const system of systems) system.afterStep?.(step);
        drainContacts();
        stepCount += 1;
      }
      if (steps > 0) targetsMoving = false;
      for (const system of systems) system.afterFrame?.(frame);
    },

    readPose(id, alpha, position, quaternion) {
      const entry = entries.get(id);
      if (entry === undefined || entry.body === null) return false;
      const t = Math.min(Math.max(alpha, 0), 1);
      position.lerpVectors(entry.previousPosition, entry.currentPosition, t);
      quaternion.slerpQuaternions(
        entry.previousQuaternion,
        entry.currentQuaternion,
        t
      );
      return true;
    },

    isMoving() {
      if (pendingAdds.length > 0 || pendingRemovals.length > 0) return true;
      if (targetsMoving) return true;
      for (const entry of active) {
        const body = entry.body;
        if (entry.type !== "dynamic" || body === null) continue;
        if (!body.isEnabled() || body.isSleeping()) continue;
        body.linvel(velocity);
        if (velocity.lengthSq() > REST_SPEED_SQ) return true;
        body.angvel(spin);
        if (spin.lengthSq() > REST_SPEED_SQ) return true;
      }
      return false;
    },

    debugRender() {
      return raw.debugRender();
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      systems.length = 0;
      listeners.length = 0;
      entries.clear();
      active.length = 0;
      pendingAdds.length = 0;
      pendingRemovals.length = 0;
      colliderIds.clear();
      queue.free();
      raw.free();
    },
  };

  const frame: Mutable<FrameContext> = { world, delta: 0, steps: 0 };
  const step: Mutable<StepContext> = {
    world,
    dt: timestep,
    index: 0,
    count: 0,
    lag: 0,
  };

  return world;
}

function byId(a: Entry, b: Entry): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
