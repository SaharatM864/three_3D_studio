import {
  BoxGeometry,
  CylinderGeometry,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  type BufferGeometry,
} from "three";

import type { PrimitiveShape, Vec3 } from "@/model/types";
import {
  primitiveCollider,
  type ColliderGeometry,
  type MeshData,
} from "@/physics/shapes";
import type { ResolvedPhysics } from "@/presets/physics";

export const UNIT_SIZE: Vec3 = [1, 1, 1];

export const unitGeometries: Readonly<Record<PrimitiveShape, BufferGeometry>> =
  {
    box: new BoxGeometry(1, 1, 1),
    sphere: new SphereGeometry(0.5, 64, 32),
    plane: new PlaneGeometry(1, 1),
    cylinder: new CylinderGeometry(0.5, 0.5, 1, 64),
    torus: new TorusGeometry(0.35, 0.15, 32, 96),
  };

const meshData = new Map<PrimitiveShape, MeshData>();

function primitiveMeshData(shape: PrimitiveShape): MeshData {
  const cached = meshData.get(shape);
  if (cached !== undefined) return cached;
  const geometry = unitGeometries[shape];
  const data: MeshData = {
    positions: geometry.getAttribute("position").array,
    indices: geometry.getIndex()?.array ?? null,
  };
  meshData.set(shape, data);
  return data;
}

export function primitiveColliderGeometry(
  shape: PrimitiveShape,
  physics: ResolvedPhysics,
  size: Vec3
): ColliderGeometry {
  return primitiveCollider(
    shape,
    physics.collider,
    size,
    primitiveMeshData(shape),
    physics.body === "dynamic"
  );
}
