import { Quaternion, Vector3 } from "three";

import { GRAVITY } from "../../constants";
import { createRigidBodyState } from "../../dynamics/body-state";
import { WATER_DENSITY } from "../constants";
import { createImmersion } from "../forces/immersion";
import { applyPressure } from "../forces/pressure";
import { clearWrench, createWrench } from "../forces/wrench";
import { createFlatWater } from "../water";
import { hullReach, type HullMesh } from "./mesh";

export interface HullHydrostatics {
  readonly displacement: number;
  readonly height: number;
  readonly waterplane: number;
  readonly heave: number;
  readonly roll: number;
  readonly pitch: number;
}

const ITERATIONS = 48;
const TILT = 0.01;
const ROLL_AXIS = new Vector3(0, 0, 1);
const PITCH_AXIS = new Vector3(1, 0, 0);

export function analyzeHydrostatics(
  mesh: HullMesh,
  centerOfMass: Vector3,
  displacement: number
): HullHydrostatics {
  const immersion = createImmersion(mesh);
  const water = createFlatWater(0);
  const state = createRigidBodyState();
  const wrench = createWrench();
  state.localCenterOfMass.copy(centerOfMass);

  const reach = hullReach(mesh, centerOfMass);

  function displaced(height: number): number {
    state.position.set(0, height, 0);
    immersion.update(state, water);
    clearWrench(wrench);
    return applyPressure(immersion.surface, state.position, wrench);
  }

  function float(orientation: Quaternion): number {
    state.orientation.copy(orientation);
    let low = -reach;
    let high = reach;
    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      const height = (low + high) / 2;
      if (displaced(height) > displacement) low = height;
      else high = height;
    }
    const height = (low + high) / 2;
    displaced(height);
    return height;
  }

  function stiffness(axis: Vector3, component: "x" | "z"): number {
    const tilt = new Quaternion();
    float(tilt.setFromAxisAngle(axis, TILT));
    const positive = wrench.torque[component];
    float(tilt.setFromAxisAngle(axis, -TILT));
    const negative = wrench.torque[component];
    return Math.max((negative - positive) / (2 * TILT), 0);
  }

  const height = float(new Quaternion());
  let waterplane = 0;
  const { surface } = immersion;
  for (let index = 0; index < surface.count; index++) {
    waterplane -= surface.areas[index * 3 + 1];
  }
  return {
    displacement,
    height,
    waterplane,
    heave: WATER_DENSITY * GRAVITY * waterplane,
    roll: stiffness(ROLL_AXIS, "z"),
    pitch: stiffness(PITCH_AXIS, "x"),
  };
}
