import type {
  BuoyancyDamping,
  BuoyancyDrag,
  BuoyancySlamming,
  BuoyancySpec,
  HullShape,
  PrimitiveShape,
  PropulsionSpec,
  Vec3,
} from "@/model/types";

import { getPreset, hasPreset } from "./registry";
import {
  assertFields,
  assertInRange,
  assertVector,
  type Bounds,
} from "./validation";

export interface ResolvedBuoyancy {
  shape: HullShape;
  size: Vec3;
  mass: number | null;
  density: number;
  centerOfMass: Vec3;
  gyration: Vec3 | null;
  drag: BuoyancyDrag;
  slamming: BuoyancySlamming | null;
  damping: BuoyancyDamping;
  addedInertia: number;
  waveFilter: number;
  propulsion: PropulsionSpec | null;
  throttle: number;
  steer: number;
}

export interface BuoyancyPreset {
  label: string;
  buoyancy: Omit<BuoyancySpec, "presetId">;
}

export interface HullFallback {
  shape: HullShape | null;
  size: Vec3;
}

export const HULL_SHAPES: readonly HullShape[] = [
  "box",
  "boat",
  "ellipsoid",
  "cylinder",
];

const DEFAULT_SLAMMING: BuoyancySlamming = { power: 2, threshold: 60 };

export const DEFAULT_BUOYANCY: Omit<
  ResolvedBuoyancy,
  "shape" | "size" | "waveFilter"
> = {
  mass: null,
  density: 500,
  centerOfMass: [0, 0, 0],
  gyration: null,
  drag: { friction: 1, pressure: 0.6, suction: 0.3, falloff: [1, 1] },
  slamming: DEFAULT_SLAMMING,
  damping: { heave: 0.3, roll: 0.15, pitch: 0.15 },
  addedInertia: 1.5,
  propulsion: null,
  throttle: 0,
  steer: 0,
};

export const DEFAULT_PROPULSION: PropulsionSpec = {
  thrust: 0.4,
  reverseThrust: 0.1,
  maxSteer: 27,
  rudder: 0.06,
  maxSpeed: 21,
  position: [0, -0.55, -0.47],
};

const BOAT_HULL: Omit<BuoyancySpec, "presetId"> = {
  shape: "boat",
  centerOfMass: [0, -0.15, -0.13],
  gyration: [0.25, 0.25, 0.38],
  drag: { friction: 1.2, pressure: 0.5, suction: 0.2 },
  damping: { heave: 0.15, roll: 0.08, pitch: 0.15 },
};

export const buoyancyPresets = {
  buoy: {
    label: "Buoy",
    buoyancy: {
      density: 350,
      centerOfMass: [0, -0.3, 0],
      drag: { pressure: 0.5, suction: 0.25 },
    },
  },
  crate: {
    label: "Crate",
    buoyancy: {
      density: 650,
      drag: { pressure: 0.7, suction: 0.35 },
    },
  },
  runabout: {
    label: "Runabout",
    buoyancy: {
      ...BOAT_HULL,
      density: 90,
      propulsion: DEFAULT_PROPULSION,
    },
  },
  "motor-yacht": {
    label: "Motor yacht",
    buoyancy: {
      ...BOAT_HULL,
      density: 110,
      propulsion: {
        thrust: 0.23,
        reverseThrust: 0.07,
        maxSteer: 22,
        rudder: 0.05,
        maxSpeed: 16.5,
        position: [0, -0.55, -0.45],
      },
    },
  },
} satisfies Record<string, BuoyancyPreset>;

export type BuoyancyPresetId = keyof typeof buoyancyPresets;

export function isBuoyancyPresetId(id: string): id is BuoyancyPresetId {
  return hasPreset(buoyancyPresets, id);
}

const PRIMITIVE_HULLS: Readonly<Record<PrimitiveShape, HullShape | null>> = {
  box: "box",
  sphere: "ellipsoid",
  cylinder: "cylinder",
  plane: null,
  torus: null,
  boat: "boat",
};

export function primitiveHullShape(shape: PrimitiveShape): HullShape | null {
  return PRIMITIVE_HULLS[shape];
}

export function resolveBuoyancy(
  spec: BuoyancySpec,
  fallback: HullFallback
): ResolvedBuoyancy {
  const preset: Omit<BuoyancySpec, "presetId"> =
    spec.presetId === undefined
      ? {}
      : getPreset(buoyancyPresets, spec.presetId, "buoyancy").buoyancy;
  const shape = spec.shape ?? preset.shape ?? fallback.shape;
  if (shape === null) {
    throw new Error(
      `Invalid buoyancy.shape: set one of ${HULL_SHAPES.join(", ")} for this object`
    );
  }
  const size = spec.size ?? preset.size ?? fallback.size;
  const weight = massSource(spec) ??
    massSource(preset) ?? {
      mass: DEFAULT_BUOYANCY.mass,
      density: DEFAULT_BUOYANCY.density,
    };
  const buoyancy: ResolvedBuoyancy = {
    shape,
    size,
    ...weight,
    centerOfMass:
      spec.centerOfMass ?? preset.centerOfMass ?? DEFAULT_BUOYANCY.centerOfMass,
    gyration: spec.gyration ?? preset.gyration ?? DEFAULT_BUOYANCY.gyration,
    drag: { ...DEFAULT_BUOYANCY.drag, ...preset.drag, ...spec.drag },
    slamming: resolveSlamming(preset.slamming, spec.slamming),
    damping: {
      ...DEFAULT_BUOYANCY.damping,
      ...preset.damping,
      ...spec.damping,
    },
    addedInertia:
      spec.addedInertia ?? preset.addedInertia ?? DEFAULT_BUOYANCY.addedInertia,
    waveFilter: spec.waveFilter ?? preset.waveFilter ?? defaultWaveFilter(size),
    propulsion: resolvePropulsion(preset.propulsion, spec.propulsion),
    throttle: spec.throttle ?? preset.throttle ?? DEFAULT_BUOYANCY.throttle,
    steer: spec.steer ?? preset.steer ?? DEFAULT_BUOYANCY.steer,
  };
  validateBuoyancy(buoyancy);
  return buoyancy;
}

function massSource(
  layer: Omit<BuoyancySpec, "presetId">
): Pick<ResolvedBuoyancy, "mass" | "density"> | undefined {
  if (layer.mass !== undefined) {
    return {
      mass: layer.mass,
      density: layer.density ?? DEFAULT_BUOYANCY.density,
    };
  }
  if (layer.density !== undefined) {
    return { mass: null, density: layer.density };
  }
  return undefined;
}

function resolveSlamming(
  preset: Partial<BuoyancySlamming> | null | undefined,
  spec: Partial<BuoyancySlamming> | null | undefined
): BuoyancySlamming | null {
  if (spec === null) return null;
  if (spec === undefined && preset === null) return null;
  return { ...DEFAULT_SLAMMING, ...preset, ...spec };
}

function resolvePropulsion(
  preset: Partial<PropulsionSpec> | null | undefined,
  spec: Partial<PropulsionSpec> | null | undefined
): PropulsionSpec | null {
  if (spec === null) return null;
  if (spec === undefined && (preset === undefined || preset === null)) {
    return null;
  }
  return { ...DEFAULT_PROPULSION, ...preset, ...spec };
}

const WAVE_FILTER_SCALE = 0.1;
const WAVE_FILTER_MIN = 0.25;
const WAVE_FILTER_MAX = 2;

function defaultWaveFilter([beam, , length]: Vec3): number {
  return Math.min(
    Math.max(WAVE_FILTER_SCALE * Math.max(beam, length), WAVE_FILTER_MIN),
    WAVE_FILTER_MAX
  );
}

const SIZE_BOUNDS: Bounds = [0, 1000, false];
const MASS_BOUNDS: Bounds = [0, 1e8, false];
const DENSITY_BOUNDS: Bounds = [1, 20_000];
const CENTER_OF_MASS_BOUNDS: Bounds = [-0.5, 0.5];
const GYRATION_BOUNDS: Bounds = [0.05, 1];
const FALLOFF_BOUNDS: Bounds = [0, 4];

const DRAG_BOUNDS: Record<Exclude<keyof BuoyancyDrag, "falloff">, Bounds> = {
  friction: [0, 10],
  pressure: [0, 10],
  suction: [0, 10],
};

const SLAMMING_BOUNDS: Record<keyof BuoyancySlamming, Bounds> = {
  power: [0.5, 8],
  threshold: [0, 10_000, false],
};

const BODY_BOUNDS = {
  addedInertia: [1, 4],
  waveFilter: [0.1, 8],
  throttle: [-1, 1],
  steer: [-1, 1],
} satisfies Record<string, Bounds>;

const DAMPING_BOUNDS: Record<keyof BuoyancyDamping, Bounds> = {
  heave: [0, 2],
  roll: [0, 2],
  pitch: [0, 2],
};

const PROPULSION_BOUNDS: Record<
  Exclude<keyof PropulsionSpec, "position">,
  Bounds
> = {
  thrust: [0, 10],
  reverseThrust: [0, 10],
  maxSteer: [0, 60],
  rudder: [0, 1],
  maxSpeed: [0, 100, false],
};

function validateBuoyancy(buoyancy: ResolvedBuoyancy): void {
  const name = "buoyancy";
  if (!HULL_SHAPES.includes(buoyancy.shape)) {
    throw new Error(
      `Invalid ${name}.shape "${buoyancy.shape}": use one of ${HULL_SHAPES.join(", ")}`
    );
  }
  assertVector(`${name}.size`, buoyancy.size, 3, SIZE_BOUNDS);
  if (buoyancy.mass !== null) {
    assertInRange(`${name}.mass`, buoyancy.mass, MASS_BOUNDS);
  }
  assertInRange(`${name}.density`, buoyancy.density, DENSITY_BOUNDS);
  assertVector(
    `${name}.centerOfMass`,
    buoyancy.centerOfMass,
    3,
    CENTER_OF_MASS_BOUNDS
  );
  if (buoyancy.gyration !== null) {
    assertVector(`${name}.gyration`, buoyancy.gyration, 3, GYRATION_BOUNDS);
  }
  assertFields(`${name}.drag`, buoyancy.drag, DRAG_BOUNDS);
  assertVector(
    `${name}.drag.falloff`,
    buoyancy.drag.falloff,
    2,
    FALLOFF_BOUNDS
  );
  if (buoyancy.slamming !== null) {
    assertFields(`${name}.slamming`, buoyancy.slamming, SLAMMING_BOUNDS);
  }
  assertFields(`${name}.damping`, buoyancy.damping, DAMPING_BOUNDS);
  assertFields(name, buoyancy, BODY_BOUNDS);
  if (buoyancy.propulsion !== null) {
    assertFields(`${name}.propulsion`, buoyancy.propulsion, PROPULSION_BOUNDS);
    assertVector(
      `${name}.propulsion.position`,
      buoyancy.propulsion.position,
      3,
      [-1, 1]
    );
  }
}
