import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { Group } from "three";

import type { Vec3 } from "@/model/types";
import type { ResolvedBuoyancy } from "@/presets/buoyancy";

import { useBuoyancy } from "./buoyancy";

export interface FloatingObjectProps {
  id: string;
  buoyancy: ResolvedBuoyancy;
  position: Vec3;
  rotation: Vec3;
  children?: ReactNode;
}

export function FloatingObject({
  id,
  buoyancy,
  position,
  rotation,
  children,
}: FloatingObjectProps) {
  const system = useBuoyancy();
  const group = useRef<Group>(null);

  useLayoutEffect(() => {
    const target = group.current;
    if (target === null) return;
    target.position.set(...position);
    target.rotation.set(...rotation);
    return system?.add(id, buoyancy, target);
  }, [system, id, buoyancy, position, rotation]);

  return <group ref={group}>{children}</group>;
}
