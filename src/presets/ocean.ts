import type {
  EnvironmentSpec,
  OceanColor,
  OceanFoam,
  OceanSpec,
  OceanUnderwater,
  OceanUnderwaterSpec,
  OceanWaves,
} from "@/model/types";

import { getPreset, hasPreset } from "./registry";
import {
  assertFields,
  assertInRange,
  assertVector,
  type Bounds,
} from "./validation";

export interface ResolvedOcean {
  wind: OceanWaves;
  swell: OceanWaves;
  choppiness: number;
  foam: OceanFoam;
  color: OceanColor;
  detail: number;
  subsurface: number;
  timeScale: number;
  seed: number;
  underwater: OceanUnderwater;
}

export interface OceanPreset {
  label: string;
  ocean: Omit<OceanSpec, "presetId">;
}

export interface UnderwaterPreset {
  label: string;
  underwater: Partial<OceanUnderwater>;
}

export const OCEAN_COLORS: readonly OceanColor[] = ["open-ocean", "tropical"];

const POSEIDON_EXTINCTION = [0.4497, 0.1769, 0.2825] as const;

export const DEFAULT_UNDERWATER: OceanUnderwater = {
  extinction: POSEIDON_EXTINCTION,
  backscatter: POSEIDON_EXTINCTION,
  downwelling: POSEIDON_EXTINCTION,
  tint: [1, 1, 1],
  caustics: 1,
};

export const DEFAULT_OCEAN: ResolvedOcean = {
  wind: { speed: 10.5, direction: 45, fetch: 90_000, scale: 0.48 },
  swell: { speed: 14, direction: 13, fetch: 380_000, scale: 0.36 },
  choppiness: 2.2,
  foam: {
    threshold: 0.32,
    scale: 2.5,
    decay: 3.9,
    spread: 1.32,
    brightness: 0.88,
    relief: 0.18,
    milk: 0.45,
  },
  color: "open-ocean",
  detail: 0.1,
  subsurface: 1,
  timeScale: 1,
  seed: 0x5eed0cea,
  underwater: DEFAULT_UNDERWATER,
};

export const oceanPresets = {
  calm: {
    label: "Calm",
    ocean: {
      wind: { speed: 5, scale: 0.42 },
      swell: { scale: 0.2 },
      choppiness: 1.6,
    },
  },
  moderate: {
    label: "Moderate",
    ocean: {},
  },
  rough: {
    label: "Rough",
    ocean: {
      wind: { speed: 13, scale: 0.5 },
      swell: { scale: 0.42 },
      choppiness: 2.2,
    },
  },
} satisfies Record<string, OceanPreset>;

export type OceanPresetId = keyof typeof oceanPresets;

export const underwaterPresets = {
  ocean: {
    label: "Open ocean",
    underwater: {},
  },
  clear: {
    label: "Clear",
    underwater: {
      extinction: [0.25, 0.07, 0.035],
      backscatter: [0.25, 0.07, 0.035],
      downwelling: [0.25, 0.07, 0.035],
      tint: [0.85, 1, 1.15],
      caustics: 1.2,
    },
  },
  coastal: {
    label: "Coastal",
    underwater: {
      extinction: [0.55, 0.3, 0.45],
      backscatter: [0.55, 0.3, 0.45],
      downwelling: [0.55, 0.3, 0.45],
      tint: [0.9, 1.1, 0.8],
      caustics: 0.7,
    },
  },
  murky: {
    label: "Murky",
    underwater: {
      extinction: [0.9, 0.7, 0.9],
      backscatter: [0.9, 0.7, 0.9],
      downwelling: [0.9, 0.7, 0.9],
      tint: [1, 1, 0.7],
      caustics: 0.3,
    },
  },
} satisfies Record<string, UnderwaterPreset>;

export type UnderwaterPresetId = keyof typeof underwaterPresets;

export function isUnderwaterPresetId(id: string): id is UnderwaterPresetId {
  return hasPreset(underwaterPresets, id);
}

export type OceanOverride = OceanPresetId | "off";

export function isOceanPresetId(id: string): id is OceanPresetId {
  return hasPreset(oceanPresets, id);
}

export function resolveOcean(spec: OceanSpec): ResolvedOcean {
  const preset: Omit<OceanSpec, "presetId"> =
    spec.presetId === undefined ? {} : presetOcean(spec.presetId);
  const ocean: ResolvedOcean = {
    wind: { ...DEFAULT_OCEAN.wind, ...preset.wind, ...spec.wind },
    swell: { ...DEFAULT_OCEAN.swell, ...preset.swell, ...spec.swell },
    choppiness:
      spec.choppiness ?? preset.choppiness ?? DEFAULT_OCEAN.choppiness,
    foam: { ...DEFAULT_OCEAN.foam, ...preset.foam, ...spec.foam },
    color: spec.color ?? preset.color ?? DEFAULT_OCEAN.color,
    detail: spec.detail ?? preset.detail ?? DEFAULT_OCEAN.detail,
    subsurface:
      spec.subsurface ?? preset.subsurface ?? DEFAULT_OCEAN.subsurface,
    timeScale: spec.timeScale ?? preset.timeScale ?? DEFAULT_OCEAN.timeScale,
    seed: spec.seed ?? preset.seed ?? DEFAULT_OCEAN.seed,
    underwater: resolveUnderwater(preset.underwater, spec.underwater),
  };
  validateOcean(ocean);
  return ocean;
}

function resolveUnderwater(
  preset: OceanUnderwaterSpec | undefined,
  spec: OceanUnderwaterSpec | undefined
): OceanUnderwater {
  const presetId = spec?.presetId ?? preset?.presetId;
  const water: Partial<OceanUnderwater> =
    presetId === undefined
      ? {}
      : getPreset(underwaterPresets, presetId, "underwater").underwater;
  const pick = <K extends keyof OceanUnderwater>(key: K): OceanUnderwater[K] =>
    spec?.[key] ?? preset?.[key] ?? water[key] ?? DEFAULT_UNDERWATER[key];
  return {
    extinction: pick("extinction"),
    backscatter: pick("backscatter"),
    downwelling: pick("downwelling"),
    tint: pick("tint"),
    caustics: pick("caustics"),
  };
}

export function applyOceanOverride(
  spec: EnvironmentSpec,
  override: OceanOverride
): EnvironmentSpec {
  return {
    ...spec,
    ocean:
      override === "off"
        ? undefined
        : { presetId: override, underwater: spec.ocean?.underwater },
  };
}

export function applyUnderwaterOverride(
  spec: EnvironmentSpec,
  override: UnderwaterPresetId
): EnvironmentSpec {
  if (spec.ocean === undefined) return spec;
  return {
    ...spec,
    ocean: { ...spec.ocean, underwater: { presetId: override } },
  };
}

function presetOcean(id: string): Omit<OceanSpec, "presetId"> {
  return getPreset(oceanPresets, id, "ocean").ocean;
}

const WAVES_BOUNDS: Record<keyof OceanWaves, Bounds> = {
  speed: [0.5, 30],
  direction: [0, 360],
  fetch: [1, 1e6],
  scale: [0, 2],
};

const FOAM_BOUNDS: Record<keyof OceanFoam, Bounds> = {
  threshold: [-0.5, 1.5],
  scale: [0.2, 8],
  decay: [0.5, 14],
  spread: [0, 4],
  brightness: [0.2, 1.4],
  relief: [0, 0.4],
  milk: [0, 0.8],
};

const SURFACE_BOUNDS = {
  choppiness: [0, 2.5],
  detail: [0, 0.5],
  subsurface: [0, 3],
  timeScale: [0, 3],
} satisfies Record<string, Bounds>;

const ATTENUATION_BOUNDS: Bounds = [0.001, 5];
const TINT_BOUNDS: Bounds = [0, 2];
const CAUSTICS_BOUNDS: Bounds = [0, 2];

const SEED_MAX = 0xffffffff;

function validateOcean(ocean: ResolvedOcean): void {
  assertFields("ocean.wind", ocean.wind, WAVES_BOUNDS);
  assertFields("ocean.swell", ocean.swell, WAVES_BOUNDS);
  assertFields("ocean.foam", ocean.foam, FOAM_BOUNDS);
  assertFields("ocean", ocean, SURFACE_BOUNDS);
  if (!OCEAN_COLORS.includes(ocean.color)) {
    throw new Error(
      `Invalid ocean.color "${ocean.color}": use one of ${OCEAN_COLORS.join(", ")}`
    );
  }
  if (!Number.isInteger(ocean.seed)) {
    throw new Error(`Invalid ocean.seed ${ocean.seed}: expected an integer`);
  }
  assertInRange("ocean.seed", ocean.seed, [0, SEED_MAX]);
  validateUnderwater(ocean.underwater);
}

function validateUnderwater(underwater: OceanUnderwater): void {
  const name = "ocean.underwater";
  assertVector(
    `${name}.extinction`,
    underwater.extinction,
    3,
    ATTENUATION_BOUNDS
  );
  assertVector(
    `${name}.backscatter`,
    underwater.backscatter,
    3,
    ATTENUATION_BOUNDS
  );
  assertVector(
    `${name}.downwelling`,
    underwater.downwelling,
    3,
    ATTENUATION_BOUNDS
  );
  assertVector(`${name}.tint`, underwater.tint, 3, TINT_BOUNDS);
  assertInRange(`${name}.caustics`, underwater.caustics, CAUSTICS_BOUNDS);
}
