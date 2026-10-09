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

export const DEFAULT_UNDERWATER: OceanUnderwater = {
  absorption: [0.2, 0.06, 0.025],
  scattering: [0.055, 0.06, 0.073],
  whiteBalance: 0.5,
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
    label: "Clear tropical",
    underwater: {
      absorption: [0.195, 0.052, 0.015],
      scattering: [0.025, 0.03, 0.037],
      caustics: 1.2,
    },
  },
  coastal: {
    label: "Coastal (green)",
    underwater: {
      absorption: [0.37, 0.14, 0.23],
      scattering: [0.28, 0.3, 0.37],
      caustics: 0.7,
    },
  },
  murky: {
    label: "Murky",
    underwater: {
      absorption: [0.56, 0.4, 0.73],
      scattering: [0.92, 1, 1.22],
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

export function resolveUnderwater(
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
    absorption: pick("absorption"),
    scattering: pick("scattering"),
    whiteBalance: pick("whiteBalance"),
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

export interface UnderwaterOverride {
  presetId: UnderwaterPresetId | null;
  whiteBalance: number | null;
}

export function applyUnderwaterOverride(
  spec: EnvironmentSpec,
  { presetId, whiteBalance }: UnderwaterOverride
): EnvironmentSpec {
  if (spec.ocean === undefined) return spec;
  const underwater: OceanUnderwaterSpec | undefined =
    presetId === null ? spec.ocean.underwater : { presetId };
  return {
    ...spec,
    ocean: {
      ...spec.ocean,
      underwater:
        whiteBalance === null ? underwater : { ...underwater, whiteBalance },
    },
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

const ABSORPTION_BOUNDS: Bounds = [0.001, 5];
const SCATTERING_BOUNDS: Bounds = [0, 5];
export const WHITE_BALANCE_BOUNDS: Bounds = [0, 1];
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
    `${name}.absorption`,
    underwater.absorption,
    3,
    ABSORPTION_BOUNDS
  );
  assertVector(
    `${name}.scattering`,
    underwater.scattering,
    3,
    SCATTERING_BOUNDS
  );
  assertInRange(
    `${name}.whiteBalance`,
    underwater.whiteBalance,
    WHITE_BALANCE_BOUNDS
  );
  assertInRange(`${name}.caustics`, underwater.caustics, CAUSTICS_BOUNDS);
}
