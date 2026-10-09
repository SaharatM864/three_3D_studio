import { AgXToneMapping } from "three";

import type { CloudsQualityPreset } from "./clouds/quality";

export type RenderQualityId = "high" | "performance";

export interface CloudsRenderSettings {
  quality: CloudsQualityPreset;
  temporalUpscale: boolean;
}

export interface OceanGridSettings {
  rings: number;
  sectors: number;
  spacing: number;
  soften: number;
}

export interface OceanRenderSettings {
  grid: OceanGridSettings;
}

export interface RenderQuality {
  dpr: [min: number, max: number];
  maxPixels: number;
  sunShadowMapSize: number;
  clouds: CloudsRenderSettings;
  ocean: OceanRenderSettings;
}

export const RENDER_QUALITIES: Record<RenderQualityId, RenderQuality> = {
  high: {
    dpr: [0.5, 2],
    maxPixels: 1920 * 1080,
    sunShadowMapSize: 2048,
    clouds: { quality: "high", temporalUpscale: true },
    ocean: { grid: { rings: 620, sectors: 1280, spacing: 0.35, soften: 41 } },
  },
  performance: {
    dpr: [0.5, 1],
    maxPixels: 1280 * 720,
    sunShadowMapSize: 1024,
    clouds: { quality: "medium", temporalUpscale: true },
    ocean: { grid: { rings: 440, sectors: 768, spacing: 0.5, soften: 30 } },
  },
};

export const DEFAULT_RENDER_QUALITY: RenderQualityId = "high";

export const IDLE_SETTLE_FRAMES = 300;

export const CAMERA_DEFAULTS = { fov: 50, near: 0.1, far: 1e5 };

export const RENDER_PRIORITY = 1;

export const TONE_MAPPING = AgXToneMapping;

export const SUN_SHADOW = {
  distance: 30,
  extent: 20,
  normalBias: 0.02,
};
