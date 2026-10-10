import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { Group } from "three";

import type { PrimitiveShape, Vec3 } from "@/model/types";
import type { ResolvedPhysics } from "@/presets/physics";

import { primitiveColliderGeometry } from "../objects/primitive-geometry";
import { usePhysics } from "./physics";

export interface PhysicsObjectProps {
  id: string;
  physics: ResolvedPhysics;
  shape: PrimitiveShape;
  size: Vec3;
  position: Vec3;
  rotation: Vec3;
  children?: ReactNode;
}

export function PhysicsObject({
  id,
  physics,
  shape,
  size,
  position,
  rotation,
  children,
}: PhysicsObjectProps) {
  const handle = usePhysics();
  const group = useRef<Group>(null);

  useLayoutEffect(() => {
    const target = group.current;
    if (target === null) return;
    target.position.set(...position);
    target.rotation.set(...rotation);
    if (handle === null) return;
    return handle.add({
      id,
      physics,
      geometry: primitiveColliderGeometry(shape, physics, size),
      target,
    });
  }, [handle, id, physics, shape, size, position, rotation]);

  return <group ref={group}>{children}</group>;
}
