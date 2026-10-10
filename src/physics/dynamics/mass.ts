import type { Vector3 } from "three";

export interface BodyMass {
  readonly mass: number;
  readonly centerOfMass: Vector3;
  readonly inertia: Vector3;
}
