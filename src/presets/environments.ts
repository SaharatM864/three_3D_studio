import type { ColorValue, EnvironmentSpec, GeoLocation } from "@/model/types";

export interface EnvironmentPreset {
  label: string;
  swatch: ColorValue;
  environment: Omit<EnvironmentSpec, "presetId">;
}

export interface ResolvedEnvironment {
  location: Required<GeoLocation>;
  dateTime: string;
  exposure: number;
}

export const DEFAULT_ENVIRONMENT: ResolvedEnvironment = {
  location: { latitude: 13.7563, longitude: 100.5018, height: 0 },
  dateTime: "2026-03-21T09:00:00+07:00",
  exposure: 5,
};

export const environmentPresets = {
  morning: {
    label: "Morning",
    swatch: "#9ec5e8",
    environment: { dateTime: "2026-03-21T09:00:00+07:00" },
  },
  noon: {
    label: "Noon",
    swatch: "#5f9fd9",
    environment: { dateTime: "2026-03-21T12:00:00+07:00" },
  },
  "golden-hour": {
    label: "Golden hour",
    swatch: "#f2a65a",
    environment: { dateTime: "2026-03-21T17:45:00+07:00" },
  },
} satisfies Record<string, EnvironmentPreset>;

export type EnvironmentPresetId = keyof typeof environmentPresets;

export function isEnvironmentPresetId(id: string): id is EnvironmentPresetId {
  return Object.hasOwn(environmentPresets, id);
}

export function resolveEnvironment(spec: EnvironmentSpec): ResolvedEnvironment {
  const preset: Omit<EnvironmentSpec, "presetId"> =
    spec.presetId === undefined ? {} : presetEnvironment(spec.presetId);

  return {
    location: {
      ...DEFAULT_ENVIRONMENT.location,
      ...preset.location,
      ...spec.location,
    },
    dateTime: spec.dateTime ?? preset.dateTime ?? DEFAULT_ENVIRONMENT.dateTime,
    exposure: spec.exposure ?? preset.exposure ?? DEFAULT_ENVIRONMENT.exposure,
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
  if (!isEnvironmentPresetId(id)) {
    throw new Error(`Unknown environment preset "${id}"`);
  }
  return environmentPresets[id].environment;
}
