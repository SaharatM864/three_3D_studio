import { MathUtils, Quaternion, Vector3 } from "three";

import type { PropulsionSpec } from "@/model/types";

import { GRAVITY, WATER_DENSITY } from "./constants";
import type { Hull } from "./hull";
import { pointVelocity, type RigidBodyState } from "./rigid-body";
import { createWaterSample, type WaterSurface } from "./water";

export interface HydroProperties {
  readonly hull: Hull;
  readonly mass: number;
  readonly centerOfMass: Vector3;
  readonly restVolume: number;
  readonly sideDrag: number;
  readonly heaveDrag: number;
  readonly surgeDrag: number;
  readonly linearDrag: number;
  readonly heaveDamping: number;
  readonly rollDamping: number;
  readonly pitchDamping: number;
  readonly probes: Float32Array;
}

export interface PropulsionProperties {
  readonly spec: PropulsionSpec;
  readonly position: Vector3;
  readonly rudderArea: number;
  readonly planingArea: number;
}

export interface Controls {
  throttle: number;
  steer: number;
}

export interface ForceAccumulator {
  readonly force: Vector3;
  readonly torque: Vector3;
  readonly bodyTorque: Vector3;
}

const HALF_DENSITY = 0.5 * WATER_DENSITY;
const COLUMN_EPSILON = 1e-4;
const PROP_IMMERSION = 0.25;
const STEER_SPEED_FALLOFF = 0.045;
const RUDDER_MIN_SPEED = 0.5;
const PLANING_MIN_SPEED = 2;
const ADVANCE_LOSS = 0.38;
const ADVANCE_MIN = 0.58;
const HEEL_CUT_START = 0.25;
const HEEL_CUT_END = 0.6;

const sample = createWaterSample();
const inverse = new Quaternion();
const lower = new Vector3();
const upper = new Vector3();
const point = new Vector3();
const offset = new Vector3();
const velocity = new Vector3();
const drag = new Vector3();
const force = new Vector3();
const forward = new Vector3();
const side = new Vector3();
const up = new Vector3();
const moment = new Vector3();

export function clearForces({
  force,
  torque,
  bodyTorque,
}: ForceAccumulator): void {
  force.set(0, 0, 0);
  torque.set(0, 0, 0);
  bodyTorque.set(0, 0, 0);
}

export function applyHydrostatics(
  body: HydroProperties,
  state: RigidBodyState,
  water: WaterSurface,
  out: ForceAccumulator
): number {
  const { hull, centerOfMass: com, probes } = body;
  const orientation = state.orientation;
  inverse.copy(orientation).invert();
  let displaced = 0;

  const columns = hull.columns;
  for (let index = 0; index < columns.length; index++) {
    const column = columns[index];
    lower
      .set(column.x - com.x, column.bottom - com.y, column.z - com.z)
      .applyQuaternion(orientation)
      .add(state.position);
    upper
      .set(column.x - com.x, column.top - com.y, column.z - com.z)
      .applyQuaternion(orientation)
      .add(state.position);
    const low = lower.y <= upper.y ? lower : upper;
    const high = low === lower ? upper : lower;
    water.sample((low.x + high.x) / 2, (low.z + high.z) / 2, sample);
    const span = high.y - low.y;
    const submerged =
      span > COLUMN_EPSILON
        ? MathUtils.clamp((sample.height - low.y) / span, 0, 1)
        : sample.height > low.y
          ? 1
          : 0;
    point
      .copy(high)
      .sub(low)
      .multiplyScalar(submerged / 2)
      .add(low);
    probes[index * 4] = point.x;
    probes[index * 4 + 1] = point.y;
    probes[index * 4 + 2] = point.z;
    probes[index * 4 + 3] = submerged;
    if (submerged === 0) continue;

    const volume = column.volume * submerged;
    const share = volume / hull.volume;
    displaced += volume;
    offset.subVectors(point, state.position);
    pointVelocity(state, offset, velocity);
    velocity.y -= sample.verticalVelocity;
    velocity.applyQuaternion(inverse);
    const linear = (body.linearDrag * volume) / body.restVolume;
    drag
      .set(
        -(body.sideDrag * share * Math.abs(velocity.x) + linear) * velocity.x,
        -body.heaveDrag * column.area * Math.abs(velocity.y) * velocity.y,
        -(body.surgeDrag * share * Math.abs(velocity.z) + linear) * velocity.z
      )
      .applyQuaternion(orientation);
    drag.y += WATER_DENSITY * GRAVITY * volume;
    addForceAt(out, drag, offset);
  }

  const immersion = Math.min(displaced / body.restVolume, 1);
  water.sample(state.position.x, state.position.z, sample);
  out.force.y -=
    body.mass * GRAVITY +
    body.heaveDamping *
      immersion *
      (state.velocity.y - sample.verticalVelocity);
  out.bodyTorque.x -= body.pitchDamping * immersion * state.angularVelocity.x;
  out.bodyTorque.z -= body.rollDamping * immersion * state.angularVelocity.z;
  return immersion;
}

export function applyPropulsion(
  propulsion: PropulsionProperties,
  body: HydroProperties,
  controls: Controls,
  immersion: number,
  state: RigidBodyState,
  water: WaterSurface,
  out: ForceAccumulator
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

  offset
    .copy(propulsion.position)
    .sub(body.centerOfMass)
    .applyQuaternion(orientation);
  point.addVectors(state.position, offset);
  water.sample(point.x, point.z, sample);
  const propWet = MathUtils.smoothstep(
    sample.height - point.y,
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
    ratio *
    body.mass *
    GRAVITY *
    controls.throttle *
    propWet *
    heelCut *
    advance;
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
  addForceAt(out, force, offset);

  if (surge <= PLANING_MIN_SPEED || immersion <= 0) return;
  const lift =
    Math.min(
      spec.planing * HALF_DENSITY * propulsion.planingArea * surge * surge,
      spec.planingMax * body.mass * GRAVITY
    ) * immersion;
  const { hull, probes } = body;
  let wetted = 0;
  for (let index = 0; index < hull.columns.length; index++) {
    if (probes[index * 4 + 3] > 0) wetted += hull.columns[index].area;
  }
  if (wetted === 0) return;
  for (let index = 0; index < hull.columns.length; index++) {
    if (probes[index * 4 + 3] === 0) continue;
    offset
      .set(probes[index * 4], probes[index * 4 + 1], probes[index * 4 + 2])
      .sub(state.position);
    force.set(0, (lift * hull.columns[index].area) / wetted, 0);
    addForceAt(out, force, offset);
  }
}

function addForceAt(
  out: ForceAccumulator,
  applied: Vector3,
  arm: Vector3
): void {
  out.force.add(applied);
  out.torque.add(moment.crossVectors(arm, applied));
}
