import type { RenderQuality } from "../render-config";

export interface CssSize {
  width: number;
  height: number;
}

export function resolvePixelRatio(
  { dpr: [min, max] }: RenderQuality,
  maxPixels: number,
  { width, height }: CssSize,
  deviceRatio: number
): number {
  const preferred = Math.min(Math.max(deviceRatio, min), max);
  const area = width * height;
  if (area <= 0) return preferred;
  return Math.max(min, Math.min(preferred, Math.sqrt(maxPixels / area)));
}
