import { Vector3 } from "three";

import type { RigidBodyState } from "../../dynamics/body-state";
import type { Wrench } from "./wrench";

export interface DampingCoefficients {
  readonly heave: number;
  readonly roll: number;
  readonly pitch: number;
}

const torque = new Vector3();

export function dampingCoefficient(
  ratio: number,
  stiffness: number,
  inertia: number
): number {
  return 2 * ratio * Math.sqrt(stiffness * inertia);
}

export function applyDamping(
  coefficients: DampingCoefficients,
  immersion: number,
  state: RigidBodyState,
  rising: number,
  out: Wrench
): void {
  out.force.y -= coefficients.heave * immersion * (state.velocity.y - rising);
  torque
    .set(
      -coefficients.pitch * immersion * state.localAngularVelocity.x,
      0,
      -coefficients.roll * immersion * state.localAngularVelocity.z
    )
    .applyQuaternion(state.orientation);
  out.torque.add(torque);
}
