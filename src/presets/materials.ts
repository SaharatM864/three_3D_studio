import type { MaterialSpec } from "@/model/types";

import { getPreset } from "./registry";

export interface MaterialPreset {
  label: string;
  material: Omit<MaterialSpec, "presetId">;
}

export const materialPresets = {
  "matte-plastic": {
    label: "Matte plastic",
    material: { color: "#d9d9de", metalness: 0, roughness: 0.8 },
  },
  "glossy-paint": {
    label: "Glossy paint",
    material: { color: "#e4572e", metalness: 0.1, roughness: 0.25 },
  },
  "brushed-metal": {
    label: "Brushed metal",
    material: { color: "#b8b8bc", metalness: 1, roughness: 0.45 },
  },
  chrome: {
    label: "Chrome",
    material: { color: "#ffffff", metalness: 1, roughness: 0.05 },
  },
  rubber: {
    label: "Rubber",
    material: { color: "#222222", metalness: 0, roughness: 1 },
  },
  "neon-emissive": {
    label: "Neon emissive",
    material: {
      color: "#111111",
      emissive: "#2bd9ff",
      emissiveIntensity: 3,
      metalness: 0,
      roughness: 0.5,
    },
  },
} satisfies Record<string, MaterialPreset>;

export type MaterialPresetId = keyof typeof materialPresets;

export function resolveMaterial(
  spec: MaterialSpec | undefined
): Omit<MaterialSpec, "presetId"> {
  if (spec === undefined) return {};
  const { presetId, ...overrides } = spec;
  if (presetId === undefined) return overrides;
  return {
    ...getPreset(materialPresets, presetId, "material").material,
    ...overrides,
  };
}
