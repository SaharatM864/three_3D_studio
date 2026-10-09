import { NeutralToneMapping } from "three";

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

export const PIXEL_BUDGETS = {
  "720p": 1280 * 720,
  "1080p": 1920 * 1080,
  "1440p": 2560 * 1440,
  "2160p": 3840 * 2160,
};

export type PixelBudgetId = keyof typeof PIXEL_BUDGETS;

export const OCEAN_GRIDS = {
  fine: { rings: 620, sectors: 1280, spacing: 0.35, soften: 41 },
  coarse: { rings: 440, sectors: 768, spacing: 0.5, soften: 30 },
} satisfies Record<string, OceanGridSettings>;

export type OceanGridId = keyof typeof OCEAN_GRIDS;

export const MIN_PIXEL_RATIO = 0.5;

export const MAX_PIXEL_RATIOS = [1, 1.5, 2] as const;

export const SUN_SHADOW_MAP_SIZES = [1024, 2048, 4096] as const;

export interface RenderQualitySettings {
  maxPixelRatio: number;
  pixelBudget: PixelBudgetId;
  sunShadowMapSize: number;
  clouds: CloudsQualityPreset;
  cloudsTemporalUpscale: boolean;
  oceanGrid: OceanGridId;
}

export const RENDER_QUALITIES: Record<RenderQualityId, RenderQualitySettings> =
  {
    high: {
      maxPixelRatio: 2,
      pixelBudget: "1080p",
      sunShadowMapSize: 2048,
      clouds: "high",
      cloudsTemporalUpscale: true,
      oceanGrid: "fine",
    },
    performance: {
      maxPixelRatio: 1,
      pixelBudget: "720p",
      sunShadowMapSize: 1024,
      clouds: "medium",
      cloudsTemporalUpscale: true,
      oceanGrid: "coarse",
    },
  };

export const DEFAULT_RENDER_QUALITY: RenderQualityId = "high";

export function resolveRenderQuality(
  settings: RenderQualitySettings
): RenderQuality {
  return {
    dpr: [MIN_PIXEL_RATIO, settings.maxPixelRatio],
    maxPixels: PIXEL_BUDGETS[settings.pixelBudget],
    sunShadowMapSize: settings.sunShadowMapSize,
    clouds: {
      quality: settings.clouds,
      temporalUpscale: settings.cloudsTemporalUpscale,
    },
    ocean: { grid: OCEAN_GRIDS[settings.oceanGrid] },
  };
}

export const DEFAULT_QUALITY_PROFILE = resolveRenderQuality(
  RENDER_QUALITIES[DEFAULT_RENDER_QUALITY]
);

export const IDLE_SETTLE_FRAMES = 300;

export const CAMERA_DEFAULTS = { fov: 50, near: 0.1, far: 1e5 };

export const RENDER_PRIORITY = 1;

export const TONE_MAPPING = NeutralToneMapping;

export const ATMOSPHERE_RAYMARCH_SCATTERING = false;

export const SUN_SHADOW = {
  distance: 30,
  extent: 20,
  normalBias: 0.02,
};
