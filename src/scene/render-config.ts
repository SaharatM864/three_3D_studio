import { AgXToneMapping } from "three";

export const CANVAS_DPR: [min: number, max: number] = [1, 2];

export const CAMERA_DEFAULTS = { fov: 50, near: 0.1, far: 5000 };

export const TONE_MAPPING = AgXToneMapping;

export const SUN_SHADOW = {
  distance: 30,
  extent: 20,
  mapSize: 2048,
  normalBias: 0.02,
};
