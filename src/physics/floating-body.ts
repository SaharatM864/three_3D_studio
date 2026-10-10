import { Quaternion, Vector3 } from "three";

import type { ResolvedBuoyancy } from "@/presets/buoyancy";

import { REST_SPEED, WATER_DENSITY } from "./constants";
import {
  applyHydrostatics,
  applyPropulsion,
  clearForces,
  type Controls,
  type ForceAccumulator,
  type HydroProperties,
  type PropulsionProperties,
} from "./forces";
import {
  createHull,
  hullInertia,
  hydrostaticStiffness,
  solveWaterline,
} from "./hull";
import {
  createRigidBodyState,
  integrateRigidBody,
  type MassProperties,
  type RigidBodyState,
} from "./rigid-body";
import type { WaterSurface } from "./water";

export interface FloatingBody {
  readonly state: RigidBodyState;
  readonly controls: Controls;
  readonly radius: number;
  readonly waveFilter: number;
  readonly probes: Float32Array;
  readonly immersion: number;
  readonly resting: boolean;
  reset(position: Vector3, orientation: Quaternion): void;
  step(h: number, water: WaterSurface): void;
  readPose(position: Vector3, orientation: Quaternion): void;
}

const HALF_DENSITY = 0.5 * WATER_DENSITY;

const offset = new Vector3();
const inverse = new Quaternion();

export function createFloatingBody(buoyancy: ResolvedBuoyancy): FloatingBody {
  const { shape, size, damping, drag } = buoyancy;
  const [beam, height, length] = size;
  const hull = createHull(shape, size, buoyancy.grid);
  if (hull.volume <= 0) {
    throw new Error(`Invalid buoyancy: the ${shape} hull has no volume`);
  }
  const mass = buoyancy.mass ?? buoyancy.density * hull.volume;
  const centerOfMass = new Vector3(
    buoyancy.centerOfMass[0] * beam,
    buoyancy.centerOfMass[1] * height,
    buoyancy.centerOfMass[2] * length
  );
  const inertia = hullInertia(shape, size, mass, buoyancy.addedInertia);
  const restVolume = Math.min(mass / WATER_DENSITY, hull.volume);
  const stiffness = hydrostaticStiffness(
    hull,
    solveWaterline(hull, restVolume),
    [centerOfMass.x, centerOfMass.y, centerOfMass.z]
  );

  const massProperties: MassProperties = {
    mass,
    inertia: new Vector3(inertia.pitch, inertia.yaw, inertia.roll),
  };
  const hydro: HydroProperties = {
    hull,
    mass,
    centerOfMass,
    restVolume,
    sideDrag: HALF_DENSITY * drag.coefficients[0] * length * height,
    heaveDrag: HALF_DENSITY * drag.coefficients[1],
    surgeDrag: HALF_DENSITY * drag.coefficients[2] * beam * height,
    linearDrag: drag.linear * mass,
    heaveDamping: criticalDamping(damping.heave, stiffness.heave, mass),
    rollDamping: criticalDamping(damping.roll, stiffness.roll, inertia.roll),
    pitchDamping: criticalDamping(
      damping.pitch,
      stiffness.pitch,
      inertia.pitch
    ),
    probes: new Float32Array(hull.columns.length * 4),
  };
  const propulsion: PropulsionProperties | null =
    buoyancy.propulsion === null
      ? null
      : {
          spec: buoyancy.propulsion,
          position: new Vector3(
            buoyancy.propulsion.position[0] * beam,
            buoyancy.propulsion.position[1] * height,
            buoyancy.propulsion.position[2] * length
          ),
          rudderArea: beam * height,
          planingArea: beam * length,
        };

  const state = createRigidBodyState();
  const controls: Controls = {
    throttle: buoyancy.throttle,
    steer: buoyancy.steer,
  };
  const forces: ForceAccumulator = {
    force: new Vector3(),
    torque: new Vector3(),
    bodyTorque: new Vector3(),
  };
  let immersion = 0;

  return {
    state,
    controls,
    radius: 0.5 * Math.hypot(beam, height, length),
    waveFilter: buoyancy.waveFilter,
    probes: hydro.probes,
    get immersion() {
      return immersion;
    },

    get resting() {
      return (
        state.velocity.lengthSq() < REST_SPEED * REST_SPEED &&
        state.angularVelocity.lengthSq() < REST_SPEED * REST_SPEED
      );
    },

    reset(position, orientation) {
      state.orientation.copy(orientation);
      state.position
        .copy(centerOfMass)
        .applyQuaternion(orientation)
        .add(position);
      state.velocity.set(0, 0, 0);
      state.angularVelocity.set(0, 0, 0);
      immersion = 0;
    },

    step(h, water) {
      clearForces(forces);
      immersion = applyHydrostatics(hydro, state, water, forces);
      if (propulsion !== null) {
        applyPropulsion(
          propulsion,
          hydro,
          controls,
          immersion,
          state,
          water,
          forces
        );
      }
      inverse.copy(state.orientation).invert();
      forces.bodyTorque.add(forces.torque.applyQuaternion(inverse));
      integrateRigidBody(
        state,
        massProperties,
        forces.force,
        forces.bodyTorque,
        h
      );
    },

    readPose(position, orientation) {
      orientation.copy(state.orientation);
      position
        .copy(state.position)
        .sub(offset.copy(centerOfMass).applyQuaternion(state.orientation));
    },
  };
}

function criticalDamping(
  ratio: number,
  stiffness: number,
  inertia: number
): number {
  return 2 * ratio * Math.sqrt(stiffness * inertia);
}
