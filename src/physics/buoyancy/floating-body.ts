import { Vector3 } from "three";

import type { HullShape, Vec3 } from "@/model/types";
import type { ResolvedBuoyancy } from "@/presets/buoyancy";

import type { DynamicBody } from "../dynamics/dynamic-body";
import type { BodyMass } from "../dynamics/mass";
import type { ColliderGeometry } from "../shapes";
import { WATER_DENSITY } from "./constants";
import {
  applyHydrostatics,
  applyPropulsion,
  type Controls,
  type HydroProperties,
  type PropulsionProperties,
} from "./forces";
import {
  createHull,
  hullInertia,
  hullPoints,
  hydrostaticStiffness,
  solveWaterline,
} from "./hull";
import type { WaterSurface } from "./water";

export interface FloatingBody {
  readonly mass: BodyMass;
  readonly collider: ColliderGeometry;
  readonly controls: Controls;
  readonly radius: number;
  readonly waveFilter: number;
  readonly probes: Float32Array;
  readonly immersion: number;
  applyForces(body: DynamicBody, water: WaterSurface): void;
}

const HALF_DENSITY = 0.5 * WATER_DENSITY;

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
    rollDamping: criticalDamping(damping.roll, stiffness.roll, inertia.z),
    pitchDamping: criticalDamping(damping.pitch, stiffness.pitch, inertia.x),
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

  const controls: Controls = {
    throttle: buoyancy.throttle,
    steer: buoyancy.steer,
  };
  let immersion = 0;

  return {
    mass: { mass, centerOfMass, inertia },
    collider: hullCollider(shape, size),
    controls,
    radius: 0.5 * Math.hypot(beam, height, length),
    waveFilter: buoyancy.waveFilter,
    probes: hydro.probes,
    get immersion() {
      return immersion;
    },

    applyForces(body, water) {
      immersion = applyHydrostatics(hydro, body, water);
      if (propulsion !== null) {
        applyPropulsion(propulsion, hydro, controls, immersion, body, water);
      }
    },
  };
}

function hullCollider(shape: HullShape, size: Vec3): ColliderGeometry {
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
  return { kind: "hull", points: hullPoints(shape, size) };
}

function criticalDamping(
  ratio: number,
  stiffness: number,
  inertia: number
): number {
  return 2 * ratio * Math.sqrt(stiffness * inertia);
}
