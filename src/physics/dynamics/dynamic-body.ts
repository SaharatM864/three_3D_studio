import { Vector3 } from "three";

import type { RigidBody } from "../rapier";
import {
  createRigidBodyState,
  readRigidBodyState,
  type RigidBodyState,
} from "./body-state";

export interface DynamicBody {
  readonly id: string;
  readonly state: RigidBodyState;
  addForce(force: Vector3): void;
  addTorque(torque: Vector3): void;
  addForceAtPoint(force: Vector3, point: Vector3): void;
  addLocalForce(force: Vector3): void;
  addLocalTorque(torque: Vector3): void;
  addLocalForceAtPoint(force: Vector3, point: Vector3): void;
}

export interface ManagedDynamicBody extends DynamicBody {
  beginStep(): void;
  commit(): void;
}

const arm = new Vector3();
const moment = new Vector3();
const rotated = new Vector3();

export function createDynamicBody(
  id: string,
  body: RigidBody
): ManagedDynamicBody {
  const state = createRigidBodyState();
  const force = new Vector3();
  const torque = new Vector3();
  const localForce = new Vector3();
  const localTorque = new Vector3();
  let fresh = false;
  let loaded = false;
  let local = false;
  let applied = false;

  function current(): RigidBodyState {
    if (!fresh) {
      readRigidBodyState(body, state);
      fresh = true;
    }
    return state;
  }

  return {
    id,

    get state() {
      return current();
    },

    addForce(value) {
      force.add(value);
      loaded = true;
    },

    addTorque(value) {
      torque.add(value);
      loaded = true;
    },

    addForceAtPoint(value, point) {
      force.add(value);
      torque.add(
        moment.crossVectors(arm.subVectors(point, current().position), value)
      );
      loaded = true;
    },

    addLocalForce(value) {
      localForce.add(value);
      loaded = true;
      local = true;
    },

    addLocalTorque(value) {
      localTorque.add(value);
      loaded = true;
      local = true;
    },

    addLocalForceAtPoint(value, point) {
      localForce.add(value);
      localTorque.add(
        moment.crossVectors(
          arm.subVectors(point, current().localCenterOfMass),
          value
        )
      );
      loaded = true;
      local = true;
    },

    beginStep() {
      force.set(0, 0, 0);
      torque.set(0, 0, 0);
      localForce.set(0, 0, 0);
      localTorque.set(0, 0, 0);
      fresh = false;
      loaded = false;
      local = false;
    },

    commit() {
      if (!loaded && !applied) return;
      body.resetForces(false);
      body.resetTorques(false);
      applied = loaded;
      if (!loaded) return;
      if (local) {
        const orientation = current().orientation;
        force.add(rotated.copy(localForce).applyQuaternion(orientation));
        torque.add(rotated.copy(localTorque).applyQuaternion(orientation));
      }
      body.addForce(force, true);
      body.addTorque(torque, true);
    },
  };
}
