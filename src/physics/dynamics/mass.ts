import { Vector3 } from "three";

import type { Vec3 } from "@/model/types";

export interface BodyMass {
  readonly mass: number;
  readonly centerOfMass: Vector3;
  readonly inertia: Vector3;
}

export type SolidShape = "box" | "ellipsoid" | "cylinder";

export function solidInertia(
  shape: SolidShape,
  [x, y, z]: Vec3,
  mass: number
): Vector3 {
  const x2 = x * x;
  const y2 = y * y;
  const z2 = z * z;
  const inertia =
    shape === "ellipsoid"
      ? new Vector3((y2 + z2) / 20, (x2 + z2) / 20, (x2 + y2) / 20)
      : shape === "cylinder"
        ? new Vector3(z2 / 16 + y2 / 12, (x2 + z2) / 16, x2 / 16 + y2 / 12)
        : new Vector3((y2 + z2) / 12, (x2 + z2) / 12, (x2 + y2) / 12);
  return inertia.multiplyScalar(mass);
}
