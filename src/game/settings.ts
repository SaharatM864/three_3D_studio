import { presetIds } from "@/presets/registry";
import {
  CAMERA_DEFAULTS,
  DEFAULT_RENDER_QUALITY,
  RENDER_QUALITIES,
  type RenderQualityId,
  type RenderQualitySettings,
} from "@/scene/render-config";

export interface ViewSettings {
  fov: number;
  exposureCompensation: number;
}

export interface OrbitSettings {
  rotateSpeed: number;
  zoomSpeed: number;
  panSpeed: number;
  damping: boolean;
}

export interface DebugSettings {
  showStats: boolean;
  showInspector: boolean;
  pauseWhenIdle: boolean;
  showBuoyancy: boolean;
}

export interface PlaygroundSettings {
  quality: RenderQualitySettings;
  view: ViewSettings;
  orbit: OrbitSettings;
  debug: DebugSettings;
}

export const DEFAULT_PLAYGROUND_SETTINGS: PlaygroundSettings = {
  quality: RENDER_QUALITIES[DEFAULT_RENDER_QUALITY],
  view: { fov: CAMERA_DEFAULTS.fov, exposureCompensation: 0 },
  orbit: { rotateSpeed: 1, zoomSpeed: 1, panSpeed: 1, damping: true },
  debug: {
    showStats: false,
    showInspector: false,
    pauseWhenIdle: true,
    showBuoyancy: false,
  },
};

export interface SettingRange {
  min: number;
  max: number;
  step: number;
}

export const FOV_RANGE: SettingRange = { min: 30, max: 90, step: 1 };

export const EXPOSURE_COMPENSATION_RANGE: SettingRange = {
  min: -3,
  max: 3,
  step: 0.25,
};

export const ORBIT_SPEED_RANGE: SettingRange = {
  min: 0.25,
  max: 3,
  step: 0.25,
};

const renderQualityIds = presetIds(RENDER_QUALITIES);

export function matchRenderQuality(
  settings: RenderQualitySettings
): RenderQualityId | null {
  return (
    renderQualityIds.find((id) =>
      sameRenderQuality(RENDER_QUALITIES[id], settings)
    ) ?? null
  );
}

function sameRenderQuality(
  a: RenderQualitySettings,
  b: RenderQualitySettings
): boolean {
  return (
    a.maxPixelRatio === b.maxPixelRatio &&
    a.pixelBudget === b.pixelBudget &&
    a.sunShadowMapSize === b.sunShadowMapSize &&
    a.clouds === b.clouds &&
    a.cloudsTemporalUpscale === b.cloudsTemporalUpscale &&
    a.oceanGrid === b.oceanGrid
  );
}
