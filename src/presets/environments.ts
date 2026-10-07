import type { EnvironmentSpec } from "@/model/types";

export interface EnvironmentPreset {
  label: string;
  environment: Omit<EnvironmentSpec, "presetId">;
}

export const environmentPresets = {
  "studio-gray": {
    label: "Studio gray",
    environment: { background: "#2a2a2e", exposure: 1 },
  },
  sunset: {
    label: "Sunset",
    environment: {
      background: "#f2a65a",
      fog: { color: "#f2a65a", near: 15, far: 60 },
      exposure: 1.1,
    },
  },
  night: {
    label: "Night",
    environment: {
      background: "#05050f",
      fog: { color: "#05050f", near: 8, far: 40 },
      exposure: 0.9,
    },
  },
} satisfies Record<string, EnvironmentPreset>;

export type EnvironmentPresetId = keyof typeof environmentPresets;
