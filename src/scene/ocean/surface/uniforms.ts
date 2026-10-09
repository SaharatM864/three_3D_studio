import { Matrix4, Vector2 } from "three";
import { uniform } from "three/tsl";
import type { UniformNode } from "three/webgpu";

import type { ResolvedOcean } from "@/presets/ocean";

const LUMINANCE_GAIN_PER_EXPOSURE = 1 / 1.2;

type FloatUniform = UniformNode<"float", number>;

export interface SurfaceUniforms {
  originXZ: UniformNode<"vec2", Vector2>;
  projection: UniformNode<"mat4", Matrix4>;
  previousProjection: UniformNode<"mat4", Matrix4>;
  previousView: UniformNode<"mat4", Matrix4>;
  time: FloatUniform;
  luminanceGain: FloatUniform;
  palette: FloatUniform;
  subsurface: FloatUniform;
  detail: FloatUniform;
  foamThreshold: FloatUniform;
  foamScale: FloatUniform;
  foamBrightness: FloatUniform;
  foamRelief: FloatUniform;
  foamMilk: FloatUniform;
}

export function createSurfaceUniforms(): SurfaceUniforms {
  return {
    originXZ: uniform(new Vector2()),
    projection: uniform(new Matrix4()),
    previousProjection: uniform(new Matrix4()),
    previousView: uniform(new Matrix4()),
    time: uniform(0),
    luminanceGain: uniform(1),
    palette: uniform(1),
    subsurface: uniform(1),
    detail: uniform(0.1),
    foamThreshold: uniform(0.32),
    foamScale: uniform(2.5),
    foamBrightness: uniform(0.88),
    foamRelief: uniform(0.18),
    foamMilk: uniform(0.45),
  };
}

export function applySurfaceOcean(
  uniforms: SurfaceUniforms,
  ocean: ResolvedOcean
): void {
  uniforms.palette.value = ocean.color === "tropical" ? 0 : 1;
  uniforms.subsurface.value = ocean.subsurface;
  uniforms.detail.value = ocean.detail;
  uniforms.foamThreshold.value = ocean.foam.threshold;
  uniforms.foamScale.value = ocean.foam.scale;
  uniforms.foamBrightness.value = ocean.foam.brightness;
  uniforms.foamRelief.value = ocean.foam.relief;
  uniforms.foamMilk.value = ocean.foam.milk;
}

export function applySurfaceExposure(
  uniforms: SurfaceUniforms,
  exposure: number
): void {
  uniforms.luminanceGain.value = exposure * LUMINANCE_GAIN_PER_EXPOSURE;
}
