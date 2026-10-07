import type { LightSpec } from "@/project/types";

export interface LightingPreset {
  label: string;
  lights: readonly LightSpec[];
}

/** Light rigs shared by clips (`lights: lightingPresets[id].lights`) and the playground. */
export const lightingPresets = {
  "studio-3-point": {
    label: "Studio 3-point",
    lights: [
      {
        id: "key",
        kind: "directional",
        position: [5, 6, 5],
        intensity: 2.5,
        castShadow: true,
      },
      { id: "fill", kind: "directional", position: [-6, 3, 3], intensity: 0.8 },
      { id: "rim", kind: "directional", position: [0, 5, -6], intensity: 1.5 },
      { id: "ambient", kind: "ambient", intensity: 0.2 },
    ],
  },
  "golden-hour": {
    label: "Golden hour",
    lights: [
      {
        id: "sun",
        kind: "directional",
        position: [-8, 2.5, 4],
        color: "#ffb46b",
        intensity: 3,
        castShadow: true,
      },
      {
        id: "sky",
        kind: "hemisphere",
        color: "#ffd9a0",
        groundColor: "#3a2a1a",
        intensity: 0.6,
      },
    ],
  },
  "night-neon": {
    label: "Night neon",
    lights: [
      {
        id: "magenta",
        kind: "point",
        position: [-3, 2, 2],
        color: "#ff2bd6",
        intensity: 20,
      },
      {
        id: "cyan",
        kind: "point",
        position: [3, 2, -2],
        color: "#2bd9ff",
        intensity: 20,
      },
      { id: "ambient", kind: "ambient", color: "#1a1a4a", intensity: 0.3 },
    ],
  },
} satisfies Record<string, LightingPreset>;

export type LightingPresetId = keyof typeof lightingPresets;
