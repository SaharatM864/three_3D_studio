import type { ColorValue, EnvironmentSpec, GeoLocation } from "@/model/types";

import { resolveClouds, type ResolvedClouds } from "./clouds";
import { resolveOcean, type ResolvedOcean } from "./ocean";
import { getPreset, hasPreset } from "./registry";

export interface EnvironmentPreset {
  label: string;
  swatch: ColorValue;
  environment: Omit<EnvironmentSpec, "presetId">;
}

export interface ResolvedEnvironment {
  location: Required<GeoLocation>;
  dateTime: string;
  exposure: number;
  clouds: ResolvedClouds | null;
  ocean: ResolvedOcean | null;
}

export const DEFAULT_ENVIRONMENT: ResolvedEnvironment = {
  location: { latitude: 13.7563, longitude: 100.5018, height: 0 },
  dateTime: "2026-03-21T09:00:00+07:00",
  exposure: 5,
  clouds: null,
  ocean: null,
};

export const environmentPresets = {
  morning: {
    label: "Morning",
    swatch: "#9ec5e8",
    environment: { dateTime: "2026-03-21T09:00:00+07:00", exposure: 5 },
  },
  noon: {
    label: "Noon",
    swatch: "#5f9fd9",
    environment: { dateTime: "2026-03-21T12:00:00+07:00", exposure: 5 },
  },
  "golden-hour": {
    label: "Golden hour",
    swatch: "#f2a65a",
    environment: { dateTime: "2026-03-21T17:45:00+07:00", exposure: 5 },
  },
  night: {
    label: "Night",
    swatch: "#1d2a4a",
    environment: { dateTime: "2026-03-03T22:00:00+07:00", exposure: 100 },
  },
} satisfies Record<string, EnvironmentPreset>;

export type EnvironmentPresetId = keyof typeof environmentPresets;

export function isEnvironmentPresetId(id: string): id is EnvironmentPresetId {
  return hasPreset(environmentPresets, id);
}

export function resolveEnvironment(spec: EnvironmentSpec): ResolvedEnvironment {
  const preset: Omit<EnvironmentSpec, "presetId"> =
    spec.presetId === undefined ? {} : presetEnvironment(spec.presetId);
  const clouds = spec.clouds ?? preset.clouds;
  const ocean = spec.ocean ?? preset.ocean;

  return {
    location: {
      ...DEFAULT_ENVIRONMENT.location,
      ...preset.location,
      ...spec.location,
    },
    dateTime: spec.dateTime ?? preset.dateTime ?? DEFAULT_ENVIRONMENT.dateTime,
    exposure: spec.exposure ?? preset.exposure ?? DEFAULT_ENVIRONMENT.exposure,
    clouds:
      clouds === undefined ? DEFAULT_ENVIRONMENT.clouds : resolveClouds(clouds),
    ocean:
      ocean === undefined ? DEFAULT_ENVIRONMENT.ocean : resolveOcean(ocean),
  };
}

export function applyEnvironmentPreset(
  spec: EnvironmentSpec,
  presetId: EnvironmentPresetId
): EnvironmentSpec {
  const preset = presetEnvironment(presetId);
  return {
    ...spec,
    ...preset,
    presetId,
    location: preset.location
      ? { ...spec.location, ...preset.location }
      : spec.location,
  };
}

const DATE_TIME_OFFSET = /(?:Z|[+-]\d{2}:\d{2})$/;

export function environmentEpochMs(dateTime: string): number {
  const epochMs = DATE_TIME_OFFSET.test(dateTime)
    ? Date.parse(dateTime)
    : Number.NaN;
  if (Number.isNaN(epochMs)) {
    throw new Error(
      `Invalid environment dateTime "${dateTime}": use ISO-8601 with a Z or ±hh:mm offset`
    );
  }
  return epochMs;
}

function presetEnvironment(id: string): Omit<EnvironmentSpec, "presetId"> {
  return getPreset(environmentPresets, id, "environment").environment;
}
