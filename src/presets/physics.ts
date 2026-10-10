import type {
  ColliderShape,
  CollisionLayer,
  PhysicsBodyType,
  PhysicsSpec,
} from "@/model/types";

import { getPreset, type PresetId } from "./registry";
import {
  ANY,
  assertFields,
  NON_NEGATIVE,
  UNIT,
  type Bounds,
} from "./validation";

export interface PhysicsMaterial {
  friction: number;
  restitution: number;
  density: number;
}

export type ResolvedColliderShape = Exclude<ColliderShape, "none">;

export interface ResolvedPhysics {
  body: PhysicsBodyType;
  collider: ResolvedColliderShape;
  friction: number;
  restitution: number;
  density: number;
  mass: number | null;
  layer: CollisionLayer;
  sensor: boolean;
  ccd: boolean;
  linearDamping: number;
  angularDamping: number;
  gravityScale: number;
}

export const PHYSICS_BODY_TYPES: readonly PhysicsBodyType[] = [
  "fixed",
  "kinematic",
  "dynamic",
];

export const COLLIDER_SHAPES: readonly ColliderShape[] = [
  "auto",
  "cuboid",
  "ball",
  "cylinder",
  "hull",
  "trimesh",
  "none",
];

export const COLLISION_LAYER_NAMES: readonly CollisionLayer[] = [
  "environment",
  "prop",
  "player",
  "trigger",
];

export const physicsMaterials = {
  default: { friction: 0.5, restitution: 0, density: 1000 },
  wood: { friction: 0.5, restitution: 0.2, density: 600 },
  metal: { friction: 0.4, restitution: 0.1, density: 7800 },
  rubber: { friction: 0.9, restitution: 0.7, density: 1100 },
  ice: { friction: 0.03, restitution: 0.05, density: 917 },
  concrete: { friction: 0.8, restitution: 0.05, density: 2400 },
} satisfies Record<string, PhysicsMaterial>;

export type PhysicsMaterialId = PresetId<typeof physicsMaterials>;

export const DEFAULT_PHYSICS_MATERIAL: PhysicsMaterialId = "default";

const POSITIVE: Bounds = [0, Infinity, false];

const PHYSICS_BOUNDS = {
  friction: NON_NEGATIVE,
  restitution: UNIT,
  density: POSITIVE,
  linearDamping: NON_NEGATIVE,
  angularDamping: NON_NEGATIVE,
  gravityScale: ANY,
} satisfies Partial<Record<keyof ResolvedPhysics, Bounds>>;

export function resolvePhysics(
  spec: PhysicsSpec | null | undefined,
  floating: boolean
): ResolvedPhysics | null {
  if (spec === null) {
    if (floating) {
      throw new Error(
        "Invalid physics: a floating object (buoyancy) needs a physics body"
      );
    }
    return null;
  }
  const input: PhysicsSpec = spec ?? {};
  assertMember("physics.body", input.body, PHYSICS_BODY_TYPES);
  assertMember("physics.collider", input.collider, COLLIDER_SHAPES);
  assertMember("physics.layer", input.layer, COLLISION_LAYER_NAMES);
  if (floating) assertFloating(input);

  const body = input.body ?? (floating ? "dynamic" : "fixed");
  const collider = input.collider ?? "auto";
  if (collider === "none") {
    if (body === "dynamic") {
      throw new Error(
        'Invalid physics.collider "none": a dynamic body needs a collider'
      );
    }
    return null;
  }
  if (body === "dynamic" && collider === "trimesh") {
    throw new Error(
      'Invalid physics.collider "trimesh": use "hull" or "auto" for a dynamic body'
    );
  }

  const material = getPreset(
    physicsMaterials,
    input.materialId ?? DEFAULT_PHYSICS_MATERIAL,
    "physics material"
  );
  const sensor = input.sensor ?? false;
  const physics: ResolvedPhysics = {
    body,
    collider,
    friction: input.friction ?? material.friction,
    restitution: input.restitution ?? material.restitution,
    density: input.density ?? material.density,
    mass: input.mass ?? null,
    layer: input.layer ?? defaultLayer(body, sensor),
    sensor,
    ccd: input.ccd ?? false,
    linearDamping: input.linearDamping ?? 0,
    angularDamping: input.angularDamping ?? 0,
    gravityScale: input.gravityScale ?? 1,
  };
  assertFields("physics", physics, PHYSICS_BOUNDS);
  if (physics.mass !== null) {
    assertFields("physics", { mass: physics.mass }, { mass: POSITIVE });
  }
  return physics;
}

function assertFloating(spec: PhysicsSpec): void {
  if (spec.body !== undefined && spec.body !== "dynamic") {
    throw new Error(
      `Invalid physics.body "${spec.body}": a floating object (buoyancy) is dynamic`
    );
  }
  if (spec.mass !== undefined || spec.density !== undefined) {
    throw new Error(
      "Invalid physics: set mass or density in buoyancy for a floating object"
    );
  }
  if (spec.gravityScale !== undefined && spec.gravityScale !== 1) {
    throw new Error(
      `Invalid physics.gravityScale ${spec.gravityScale}: a floating object's weight and buoyancy share one gravity`
    );
  }
}

function defaultLayer(body: PhysicsBodyType, sensor: boolean): CollisionLayer {
  if (sensor) return "trigger";
  return body === "dynamic" ? "prop" : "environment";
}

function assertMember<T extends string>(
  name: string,
  value: T | undefined,
  allowed: readonly T[]
): void {
  if (value === undefined || allowed.includes(value)) return;
  throw new Error(
    `Invalid ${name} "${value}": expected one of ${allowed.join(", ")}`
  );
}
