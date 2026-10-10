import { MathUtils, Vector3 } from "three";

import type { HullShape, Vec3 } from "@/model/types";
import type { ResolvedBuoyancy } from "@/presets/buoyancy";

import type { DynamicBody } from "../dynamics/dynamic-body";
import type { BodyMass } from "../dynamics/mass";
import type { ColliderGeometry } from "../shapes";
import { GRAVITY } from "../constants";
import { WATER_DENSITY } from "./constants";
import {
  applyDamping,
  dampingCoefficient,
  type DampingCoefficients,
} from "./forces/damping";
import { applyDrag, frictionCoefficient } from "./forces/drag";
import { createImmersion, type SubmergedSurface } from "./forces/immersion";
import { applyPressure } from "./forces/pressure";
import {
  applyPropulsion,
  type Controls,
  type Propulsion,
} from "./forces/propulsion";
import { createSlamming } from "./forces/slamming";
import { clearWrench, createWrench, type Wrench } from "./forces/wrench";
import {
  analyzeHydrostatics,
  type HullHydrostatics,
} from "./hull/hydrostatics";
import { hullMassProperties } from "./hull/mass-properties";
import { createHullMesh, hullReach, type HullMesh } from "./hull/mesh";
import { createWaterSample, type WaterSurface } from "./water";

export interface FloatingBodyDebug {
  ready: boolean;
  readonly surface: SubmergedSurface;
  readonly hydrostatic: Wrench;
  readonly hydrodynamic: Wrench;
  readonly centerOfMass: Vector3;
  readonly weight: number;
}

export interface FloatingBody {
  readonly mass: BodyMass;
  readonly collider: ColliderGeometry;
  readonly controls: Controls;
  readonly radius: number;
  readonly waveFilter: number;
  readonly hydrostatics: HullHydrostatics;
  readonly debug: FloatingBodyDebug;
  applyForces(body: DynamicBody, water: WaterSurface, dt: number): void;
  reset(): void;
}

const sample = createWaterSample();

export function createFloatingBody(buoyancy: ResolvedBuoyancy): FloatingBody {
  const { shape, size, drag, damping } = buoyancy;
  const [beam, height, length] = size;
  const mesh = createHullMesh(shape, size, buoyancy.waveFilter);
  const properties = hullMassProperties(mesh);
  if (!(properties.volume > 0)) {
    throw new Error(`Invalid buoyancy: the ${shape} hull has no volume`);
  }
  const mass = buoyancy.mass ?? buoyancy.density * properties.volume;
  const centerOfMass = new Vector3(
    buoyancy.centerOfMass[0] * beam,
    buoyancy.centerOfMass[1] * height,
    buoyancy.centerOfMass[2] * length
  );
  const gyration =
    buoyancy.gyration === null
      ? properties.gyration
      : new Vector3(
          buoyancy.gyration[0] * length,
          buoyancy.gyration[1] * length,
          buoyancy.gyration[2] * beam
        );
  const inertia = new Vector3(
    mass * gyration.x ** 2 * buoyancy.addedInertia,
    mass * gyration.y ** 2,
    mass * gyration.z ** 2 * buoyancy.addedInertia
  );
  const restVolume = Math.min(mass / WATER_DENSITY, properties.volume);
  const hydrostatics = analyzeHydrostatics(mesh, centerOfMass, restVolume);
  const coefficients: DampingCoefficients = {
    heave: dampingCoefficient(damping.heave, hydrostatics.heave, mass),
    roll: dampingCoefficient(damping.roll, hydrostatics.roll, inertia.z),
    pitch: dampingCoefficient(damping.pitch, hydrostatics.pitch, inertia.x),
  };
  const propulsion: Propulsion | null =
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
        };
  const controls: Controls = {
    throttle: buoyancy.throttle,
    steer: buoyancy.steer,
  };
  const hullLength = Math.max(beam, length);
  const immersion = createImmersion(mesh);
  const slamming =
    buoyancy.slamming === null ? null : createSlamming(mesh, buoyancy.slamming);
  const hydrostatic = createWrench();
  const hydrodynamic = createWrench();
  const thrust = createWrench();
  const debug: FloatingBodyDebug = {
    ready: false,
    surface: immersion.surface,
    hydrostatic,
    hydrodynamic,
    centerOfMass: new Vector3(),
    weight: mass * GRAVITY,
  };

  return {
    mass: { mass, centerOfMass, inertia },
    collider: hullCollider(shape, size, mesh),
    controls,
    radius: hullReach(mesh, centerOfMass),
    waveFilter: buoyancy.waveFilter,
    hydrostatics,
    debug,

    applyForces(body, water, dt) {
      const state = body.state;
      immersion.update(state, water);
      clearWrench(hydrostatic);
      clearWrench(hydrodynamic);
      const displaced = applyPressure(
        immersion.surface,
        state.position,
        hydrostatic
      );
      const ratio = MathUtils.clamp(displaced / restVolume, 0, 1);
      applyDrag(
        immersion.surface,
        drag,
        drag.friction *
          frictionCoefficient(state.velocity.length(), hullLength),
        state.position,
        hydrodynamic
      );
      slamming?.apply(
        immersion.surface,
        mass,
        dt,
        state.position,
        hydrodynamic
      );
      water.sample(state.position.x, state.position.z, sample);
      applyDamping(
        coefficients,
        ratio,
        state,
        sample.verticalVelocity,
        hydrodynamic
      );
      body.addForce(hydrostatic.force);
      body.addTorque(hydrostatic.torque);
      body.addForce(hydrodynamic.force);
      body.addTorque(hydrodynamic.torque);
      debug.centerOfMass.copy(state.position);
      debug.ready = true;
      if (propulsion === null) return;
      clearWrench(thrust);
      applyPropulsion(propulsion, controls, mass, ratio, state, water, thrust);
      body.addForce(thrust.force);
      body.addTorque(thrust.torque);
    },

    reset() {
      debug.ready = false;
      slamming?.reset();
    },
  };
}

function hullCollider(
  shape: HullShape,
  size: Vec3,
  mesh: HullMesh
): ColliderGeometry {
  const [beam, height, length] = size;
  if (shape === "box") {
    return {
      kind: "cuboid",
      halfExtents: [beam / 2, height / 2, length / 2],
      offset: [0, 0, 0],
    };
  }
  if (shape === "cylinder" && beam === length) {
    return { kind: "cylinder", halfHeight: height / 2, radius: beam / 2 };
  }
  return { kind: "hull", points: Float32Array.from(mesh.positions) };
}
