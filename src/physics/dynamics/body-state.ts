import { Quaternion, Vector3 } from "three";

import type { RigidBody } from "../rapier";

export interface RigidBodyState {
  readonly position: Vector3;
  readonly orientation: Quaternion;
  readonly velocity: Vector3;
  readonly angularVelocity: Vector3;
  readonly localVelocity: Vector3;
  readonly localAngularVelocity: Vector3;
  readonly localCenterOfMass: Vector3;
}

const inverse = new Quaternion();

export function createRigidBodyState(): RigidBodyState {
  return {
    position: new Vector3(),
    orientation: new Quaternion(),
    velocity: new Vector3(),
    angularVelocity: new Vector3(),
    localVelocity: new Vector3(),
    localAngularVelocity: new Vector3(),
    localCenterOfMass: new Vector3(),
  };
}

export function readRigidBodyState(
  body: RigidBody,
  out: RigidBodyState
): RigidBodyState {
  body.worldCom(out.position);
  body.rotation(out.orientation);
  body.linvel(out.velocity);
  body.angvel(out.angularVelocity);
  body.localCom(out.localCenterOfMass);
  inverse.copy(out.orientation).invert();
  out.localVelocity.copy(out.velocity).applyQuaternion(inverse);
  out.localAngularVelocity.copy(out.angularVelocity).applyQuaternion(inverse);
  return out;
}

export function pointVelocity(
  state: RigidBodyState,
  arm: Vector3,
  out: Vector3
): Vector3 {
  return out.crossVectors(state.angularVelocity, arm).add(state.velocity);
}
