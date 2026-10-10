import { Matrix4, Vector2, Vector3 } from "three";
import { uniform, uniformArray } from "three/tsl";
import type { UniformArrayNode, UniformNode } from "three/webgpu";

import type { ResolvedOcean } from "@/presets/ocean";

import { resolveWaterOptics } from "../underwater/optics";
import { CLIPMAP_MAX_LEVELS } from "./constants";

const LUMINANCE_GAIN_PER_EXPOSURE = 1 / 1.2;

type FloatUniform = UniformNode<"float", number>;
type Vec2Uniform = UniformNode<"vec2", Vector2>;
type Vec3Uniform = UniformNode<"vec3", Vector3>;

export interface ClipmapUniforms {
  origin: Vec2Uniform;
  viewer: Vec2Uniform;
  levelOffsets: UniformArrayNode<"vec2">;
  levelOffsetValues: readonly Vector2[];
  baseSpacing: FloatUniform;
  resolution: FloatUniform;
}

export interface SurfaceUniforms {
  clipmap: ClipmapUniforms;
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
  downwelling: Vec3Uniform;
  albedo: Vec3Uniform;
  whiteBalance: FloatUniform;
  caustics: FloatUniform;
}

function createClipmapUniforms(): ClipmapUniforms {
  const levelOffsetValues = Array.from(
    { length: CLIPMAP_MAX_LEVELS },
    () => new Vector2()
  );
  return {
    origin: uniform(new Vector2()),
    viewer: uniform(new Vector2()),
    levelOffsets: uniformArray(levelOffsetValues, "vec2"),
    levelOffsetValues,
    baseSpacing: uniform(1),
    resolution: uniform(1),
  };
}

export function createSurfaceUniforms(): SurfaceUniforms {
  return {
    clipmap: createClipmapUniforms(),
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
    downwelling: uniform(new Vector3()),
    albedo: uniform(new Vector3()),
    whiteBalance: uniform(0),
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
  const optics = resolveWaterOptics(underwater);
  uniforms.extinction.value.fromArray(optics.extinction);
  uniforms.downwelling.value.fromArray(optics.downwelling);
  uniforms.albedo.value.fromArray(optics.albedo);
  uniforms.whiteBalance.value = underwater.whiteBalance;
  uniforms.caustics.value = underwater.caustics;
}

export function applySurfaceExposure(
  uniforms: SurfaceUniforms,
  exposure: number
): void {
  uniforms.luminanceGain.value = exposure * LUMINANCE_GAIN_PER_EXPOSURE;
}
