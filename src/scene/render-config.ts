import { AgXToneMapping } from "three";

import type { CloudsQualityPreset } from "./clouds/quality";

export type RenderQualityId = "high" | "performance";

export interface CloudsRenderSettings {
  quality: CloudsQualityPreset;
  temporalUpscale: boolean;
}

export interface RenderQuality {
  dpr: [min: number, max: number];
  clouds: CloudsRenderSettings;
}

export const RENDER_QUALITIES: Record<RenderQualityId, RenderQuality> = {
  high: {
    dpr: [1, 2],
    clouds: { quality: "high", temporalUpscale: true },
  },
  performance: {
    dpr: [1, 1],
    clouds: { quality: "medium", temporalUpscale: true },
  },
};

export const DEFAULT_RENDER_QUALITY: RenderQualityId = "high";

export const CAMERA_DEFAULTS = { fov: 50, near: 0.1, far: 5000 };

export const RENDER_PRIORITY = 1;

export const TONE_MAPPING = AgXToneMapping;

export const SUN_SHADOW = {
  distance: 30,
  extent: 20,
  mapSize: 2048,
  normalBias: 0.02,
};
