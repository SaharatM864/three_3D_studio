import type {
  EnvironmentSpec,
  OceanColor,
  OceanFoam,
  OceanSpec,
  OceanWaves,
} from "@/model/types";

import {
  ANY,
  assertFields,
  assertInRange,
  NON_NEGATIVE,
  UNIT,
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
}

export interface OceanPreset {
  label: string;
  ocean: Omit<OceanSpec, "presetId">;
}

export const OCEAN_COLORS: readonly OceanColor[] = ["open-ocean", "tropical"];

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
      wind: { speed: 16, scale: 0.5 },
      swell: { speed: 16, scale: 0.42 },
      choppiness: 2.4,
    },
  },
} satisfies Record<string, OceanPreset>;

export type OceanPresetId = keyof typeof oceanPresets;

export type OceanOverride = OceanPresetId | "off";

export function isOceanPresetId(id: string): id is OceanPresetId {
  return Object.hasOwn(oceanPresets, id);
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
  };
  validateOcean(ocean);
  return ocean;
}

export function applyOceanOverride(
  spec: EnvironmentSpec,
  override: OceanOverride
): EnvironmentSpec {
  return {
    ...spec,
    ocean: override === "off" ? undefined : { presetId: override },
  };
}

function presetOcean(id: string): Omit<OceanSpec, "presetId"> {
  if (!isOceanPresetId(id)) {
    throw new Error(`Unknown ocean preset "${id}"`);
  }
  return oceanPresets[id].ocean;
}

const WAVES_BOUNDS: Record<keyof OceanWaves, Bounds> = {
  speed: [0.5, 100],
  direction: ANY,
  fetch: [1, Infinity],
  scale: NON_NEGATIVE,
};

const FOAM_BOUNDS: Record<keyof OceanFoam, Bounds> = {
  threshold: [-1, 2],
  scale: NON_NEGATIVE,
  decay: NON_NEGATIVE,
  spread: NON_NEGATIVE,
  brightness: NON_NEGATIVE,
  relief: NON_NEGATIVE,
  milk: UNIT,
};

function validateOcean(ocean: ResolvedOcean): void {
  assertFields("ocean.wind", ocean.wind, WAVES_BOUNDS);
  assertFields("ocean.swell", ocean.swell, WAVES_BOUNDS);
  assertFields("ocean.foam", ocean.foam, FOAM_BOUNDS);
  assertInRange("ocean.choppiness", ocean.choppiness, NON_NEGATIVE);
  assertInRange("ocean.detail", ocean.detail, NON_NEGATIVE);
  assertInRange("ocean.subsurface", ocean.subsurface, NON_NEGATIVE);
  assertInRange("ocean.timeScale", ocean.timeScale, NON_NEGATIVE);
  if (!OCEAN_COLORS.includes(ocean.color)) {
    throw new Error(
      `Invalid ocean.color "${ocean.color}": use one of ${OCEAN_COLORS.join(", ")}`
    );
  }
  if (!Number.isSafeInteger(ocean.seed)) {
    throw new Error(`Invalid ocean.seed ${ocean.seed}: expected an integer`);
  }
}
