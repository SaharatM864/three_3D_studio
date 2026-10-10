import { MathUtils, Vector3 } from "three";

import type { PropulsionSpec } from "@/model/types";

import { GRAVITY } from "../../constants";
import type { RigidBodyState } from "../../dynamics/body-state";
import { HALF_DENSITY } from "../constants";
import { createWaterSample, type WaterSurface } from "../water";
import { addForce, type Wrench } from "./wrench";

export interface Propulsion {
  readonly spec: PropulsionSpec;
  readonly position: Vector3;
  readonly rudderArea: number;
}

export interface Controls {
  throttle: number;
  steer: number;
}

const PROP_IMMERSION = 0.25;
const STEER_SPEED_FALLOFF = 0.045;
const RUDDER_MIN_SPEED = 0.5;
const ADVANCE_LOSS = 0.38;
const ADVANCE_MIN = 0.58;
const HEEL_CUT_START = 0.25;
const HEEL_CUT_END = 0.6;

const sample = createWaterSample();
const forward = new Vector3();
const side = new Vector3();
const up = new Vector3();
const arm = new Vector3();
const force = new Vector3();

export function applyPropulsion(
  propulsion: Propulsion,
  controls: Controls,
  mass: number,
  immersion: number,
  state: RigidBodyState,
  water: WaterSurface,
  out: Wrench
): void {
  const { spec } = propulsion;
  const orientation = state.orientation;
  forward.set(0, 0, 1).applyQuaternion(orientation);
  side.set(1, 0, 0).applyQuaternion(orientation);
  up.set(0, 1, 0).applyQuaternion(orientation);
  const speed = state.velocity.length();
  const surge = state.velocity.dot(forward);
  const angle =
    (controls.steer * MathUtils.degToRad(spec.maxSteer)) /
    (1 + STEER_SPEED_FALLOFF * speed);

  arm
    .copy(propulsion.position)
    .sub(state.localCenterOfMass)
    .applyQuaternion(orientation);
  water.sample(state.position.x + arm.x, state.position.z + arm.z, sample);
  const propWet = MathUtils.smoothstep(
    sample.height - (state.position.y + arm.y),
    0,
    PROP_IMMERSION
  );
  const heelCut = MathUtils.smoothstep(up.y, HEEL_CUT_START, HEEL_CUT_END);
  const advance = MathUtils.clamp(
    1 - (ADVANCE_LOSS * Math.abs(surge)) / spec.maxSpeed,
    ADVANCE_MIN,
    1
  );
  const ratio = controls.throttle >= 0 ? spec.thrust : spec.reverseThrust;
  const thrust =
    ratio * mass * GRAVITY * controls.throttle * propWet * heelCut * advance;
  force
    .set(Math.sin(angle), 0, Math.cos(angle))
    .applyQuaternion(orientation)
    .multiplyScalar(thrust);
  if (Math.abs(surge) > RUDDER_MIN_SPEED) {
    force.addScaledVector(
      side,
      Math.sin(angle) *
        spec.rudder *
        HALF_DENSITY *
        propulsion.rudderArea *
        surge *
        Math.abs(surge) *
        Math.max(propWet, immersion)
    );
  }
  addForce(out, force.x, force.y, force.z, arm.x, arm.y, arm.z);
}
