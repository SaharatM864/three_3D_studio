import { Quaternion, Vector3 } from "three";

import { MAX_ANGULAR_SPEED } from "./constants";

export interface RigidBodyState {
  readonly position: Vector3;
  readonly orientation: Quaternion;
  readonly velocity: Vector3;
  readonly angularVelocity: Vector3;
}

export interface MassProperties {
  readonly mass: number;
  readonly inertia: Vector3;
}

const momentum = new Vector3();
const torque = new Vector3();
const axis = new Vector3();
const rotation = new Quaternion();

export function createRigidBodyState(): RigidBodyState {
  return {
    position: new Vector3(),
    orientation: new Quaternion(),
    velocity: new Vector3(),
    angularVelocity: new Vector3(),
  };
}

export function integrateRigidBody(
  state: RigidBodyState,
  { mass, inertia }: MassProperties,
  force: Vector3,
  bodyTorque: Vector3,
  h: number
): void {
  const spin = state.angularVelocity;
  momentum.set(inertia.x * spin.x, inertia.y * spin.y, inertia.z * spin.z);
  torque.copy(bodyTorque).sub(axis.crossVectors(spin, momentum));

  state.velocity.addScaledVector(force, h / mass);
  state.position.addScaledVector(state.velocity, h);

  spin.x += (torque.x / inertia.x) * h;
  spin.y += (torque.y / inertia.y) * h;
  spin.z += (torque.z / inertia.z) * h;
  spin.clampLength(0, MAX_ANGULAR_SPEED);

  const speed = spin.length();
  if (speed > 1e-9) {
    rotation.setFromAxisAngle(axis.copy(spin).divideScalar(speed), speed * h);
    state.orientation.multiply(rotation).normalize();
  }
}

export function pointVelocity(
  state: RigidBodyState,
  offset: Vector3,
  out: Vector3
): Vector3 {
  axis.copy(state.angularVelocity).applyQuaternion(state.orientation);
  return out.crossVectors(axis, offset).add(state.velocity);
}
