import type { QuaternionLike, Vector3Like } from "three";

import type { PrimitiveShape, Vec3 } from "@/model/types";
import type { ResolvedColliderShape, ResolvedPhysics } from "@/presets/physics";

import { PLANE_THICKNESS } from "./constants";
import { collisionGroups } from "./layers";
import type { ColliderDesc, Rapier, RigidBodyDesc } from "./rapier";

export type ColliderGeometry =
  | { kind: "cuboid"; halfExtents: Vec3; offset: Vec3 }
  | { kind: "ball"; radius: number }
  | { kind: "cylinder"; halfHeight: number; radius: number }
  | { kind: "hull"; points: Float32Array }
  | { kind: "trimesh"; vertices: Float32Array; indices: Uint32Array };

export interface MeshData {
  readonly positions: ArrayLike<number>;
  readonly indices: ArrayLike<number> | null;
}

const CENTER: Vec3 = [0, 0, 0];

export function primitiveCollider(
  shape: PrimitiveShape,
  collider: ResolvedColliderShape,
  size: Vec3,
  mesh: MeshData,
  dynamic: boolean
): ColliderGeometry {
  const [width, height, depth] = size;
  switch (collider) {
    case "auto":
      return autoCollider(shape, size, mesh, dynamic);
    case "cuboid":
      return shape === "plane"
        ? planeCuboid(width, height)
        : cuboid(width, height, depth);
    case "ball":
      return { kind: "ball", radius: Math.max(width, height, depth) / 2 };
    case "cylinder":
      return {
        kind: "cylinder",
        halfHeight: height / 2,
        radius: Math.max(width, depth) / 2,
      };
    case "hull":
      return hull(mesh, size);
    case "trimesh":
      return trimesh(mesh, size);
  }
}

function autoCollider(
  shape: PrimitiveShape,
  size: Vec3,
  mesh: MeshData,
  dynamic: boolean
): ColliderGeometry {
  const [width, height, depth] = size;
  switch (shape) {
    case "box":
      return cuboid(width, height, depth);
    case "sphere":
      return width === height && height === depth
        ? { kind: "ball", radius: width / 2 }
        : hull(mesh, size);
    case "cylinder":
      return width === depth
        ? { kind: "cylinder", halfHeight: height / 2, radius: width / 2 }
        : hull(mesh, size);
    case "plane":
      return planeCuboid(width, height);
    case "torus":
      return dynamic ? hull(mesh, size) : trimesh(mesh, size);
    case "boat":
      return hull(mesh, size);
  }
}

function cuboid(
  width: number,
  height: number,
  depth: number
): ColliderGeometry {
  return {
    kind: "cuboid",
    halfExtents: [width / 2, height / 2, depth / 2],
    offset: CENTER,
  };
}

function planeCuboid(width: number, height: number): ColliderGeometry {
  return {
    kind: "cuboid",
    halfExtents: [width / 2, height / 2, PLANE_THICKNESS / 2],
    offset: [0, 0, -PLANE_THICKNESS / 2],
  };
}

function hull(mesh: MeshData, size: Vec3): ColliderGeometry {
  return { kind: "hull", points: scalePositions(mesh.positions, size) };
}

function trimesh(mesh: MeshData, size: Vec3): ColliderGeometry {
  const vertices = scalePositions(mesh.positions, size);
  const indices =
    mesh.indices === null
      ? Uint32Array.from({ length: vertices.length / 3 }, (_, index) => index)
      : Uint32Array.from(mesh.indices);
  return { kind: "trimesh", vertices, indices };
}

function scalePositions(
  positions: ArrayLike<number>,
  [x, y, z]: Vec3
): Float32Array {
  const scaled = new Float32Array(positions.length);
  for (let index = 0; index < positions.length; index += 3) {
    scaled[index] = positions[index] * x;
    scaled[index + 1] = positions[index + 1] * y;
    scaled[index + 2] = positions[index + 2] * z;
  }
  return scaled;
}

export function createColliderDesc(
  rapier: Rapier,
  geometry: ColliderGeometry,
  physics: ResolvedPhysics,
  massless: boolean
): ColliderDesc {
  const desc = shapeDesc(rapier, geometry)
    .setFriction(physics.friction)
    .setRestitution(physics.restitution)
    .setCollisionGroups(collisionGroups(physics.layer))
    .setSensor(physics.sensor);
  if (massless) desc.setDensity(0);
  else if (physics.mass !== null) desc.setMass(physics.mass);
  else desc.setDensity(physics.density);
  if (physics.sensor || physics.body !== "fixed") {
    desc.setActiveEvents(rapier.ActiveEvents.COLLISION_EVENTS);
  }
  return desc;
}

function shapeDesc(rapier: Rapier, geometry: ColliderGeometry): ColliderDesc {
  switch (geometry.kind) {
    case "cuboid": {
      const [hx, hy, hz] = geometry.halfExtents;
      const [x, y, z] = geometry.offset;
      return rapier.ColliderDesc.cuboid(hx, hy, hz).setTranslation(x, y, z);
    }
    case "ball":
      return rapier.ColliderDesc.ball(geometry.radius);
    case "cylinder":
      return rapier.ColliderDesc.cylinder(geometry.halfHeight, geometry.radius);
    case "hull": {
      const desc = rapier.ColliderDesc.convexHull(geometry.points);
      if (desc === null) {
        throw new Error(
          'Invalid physics.collider "hull": the shape is flat or degenerate'
        );
      }
      return desc;
    }
    case "trimesh":
      return rapier.ColliderDesc.trimesh(geometry.vertices, geometry.indices);
  }
}

export function createBodyDesc(
  rapier: Rapier,
  physics: ResolvedPhysics,
  position: Vector3Like,
  quaternion: QuaternionLike,
  canSleep: boolean
): RigidBodyDesc {
  const desc =
    physics.body === "dynamic"
      ? rapier.RigidBodyDesc.dynamic()
      : physics.body === "kinematic"
        ? rapier.RigidBodyDesc.kinematicPositionBased()
        : rapier.RigidBodyDesc.fixed();
  return desc
    .setTranslation(position.x, position.y, position.z)
    .setRotation({
      x: quaternion.x,
      y: quaternion.y,
      z: quaternion.z,
      w: quaternion.w,
    })
    .setLinearDamping(physics.linearDamping)
    .setAngularDamping(physics.angularDamping)
    .setGravityScale(physics.gravityScale)
    .setCcdEnabled(physics.ccd)
    .setCanSleep(canSleep);
}
