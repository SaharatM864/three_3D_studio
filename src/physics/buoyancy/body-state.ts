import { Quaternion, Vector3 } from "three";

import type { RigidBody } from "../rapier";

export interface BodyState {
  readonly position: Vector3;
  readonly orientation: Quaternion;
  readonly velocity: Vector3;
  readonly angularVelocity: Vector3;
}

const axis = new Vector3();
const inverse = new Quaternion();

export function createBodyState(): BodyState {
  return {
    position: new Vector3(),
    orientation: new Quaternion(),
    velocity: new Vector3(),
    angularVelocity: new Vector3(),
  };
}

export function readBodyState(body: RigidBody, out: BodyState): BodyState {
  body.worldCom(out.position);
  body.rotation(out.orientation);
  body.linvel(out.velocity);
  body.angvel(out.angularVelocity);
  out.angularVelocity.applyQuaternion(inverse.copy(out.orientation).invert());
  return out;
}

export function pointVelocity(
  state: BodyState,
  offset: Vector3,
  out: Vector3
): Vector3 {
  axis.copy(state.angularVelocity).applyQuaternion(state.orientation);
  return out.crossVectors(axis, offset).add(state.velocity);
}
