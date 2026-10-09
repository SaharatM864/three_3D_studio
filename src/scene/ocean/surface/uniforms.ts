import { Matrix4, Vector2, Vector3 } from "three";
import { uniform } from "three/tsl";
import type { UniformNode } from "three/webgpu";

import type { ResolvedOcean } from "@/presets/ocean";

const LUMINANCE_GAIN_PER_EXPOSURE = 1 / 1.2;

type FloatUniform = UniformNode<"float", number>;
type Vec3Uniform = UniformNode<"vec3", Vector3>;

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
  underwaterActive: FloatUniform;
  cameraPosition: Vec3Uniform;
  extinction: Vec3Uniform;
  backscatter: Vec3Uniform;
  downwelling: Vec3Uniform;
  tint: Vec3Uniform;
  caustics: FloatUniform;
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
    underwaterActive: uniform(0),
    cameraPosition: uniform(new Vector3()),
    extinction: uniform(new Vector3()),
    backscatter: uniform(new Vector3()),
    downwelling: uniform(new Vector3()),
    tint: uniform(new Vector3(1, 1, 1)),
    caustics: uniform(1),
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
  const { underwater } = ocean;
  uniforms.extinction.value.fromArray(underwater.extinction);
  uniforms.backscatter.value.fromArray(underwater.backscatter);
  uniforms.downwelling.value.fromArray(underwater.downwelling);
  uniforms.tint.value.fromArray(underwater.tint);
  uniforms.caustics.value = underwater.caustics;
}

export function applySurfaceExposure(
  uniforms: SurfaceUniforms,
  exposure: number
): void {
  uniforms.luminanceGain.value = exposure * LUMINANCE_GAIN_PER_EXPOSURE;
}
