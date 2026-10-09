import { clouds as vendorClouds } from "@yong_three/three-clouds/webgpu";
import type { Data3DTexture, Texture, Vector2, Vector3 } from "three";
import type { Node, TextureNode } from "three/webgpu";

import type { ResolvedCloudLayer } from "@/presets/clouds";

import type { CloudsQualityPreset } from "./quality";

export { DEFAULT_STBN_URL, STBNLoader } from "@takram/three-geospatial";

export const CLOUDS_REQUIRED_LIMITS = { maxSampledTexturesPerShaderStage: 32 };

interface NumberUniform {
  value: number;
}

export type CloudsNode = Node<"vec4"> & {
  coverage: number;
  qualityPreset: CloudsQualityPreset;
  temporalUpscale: boolean;
  lightShafts: boolean;
  readonly cloudLayers: { reset(): unknown };
  setCloudLayers(layers: readonly ResolvedCloudLayer[]): unknown;
  readonly localWeatherRepeat: Vector2;
  readonly localWeatherOffset: Vector2;
  readonly localWeatherVelocity: Vector2;
  readonly shapeRepeat: Vector3;
  readonly shapeOffset: Vector3;
  readonly shapeVelocity: Vector3;
  readonly shapeDetailRepeat: Vector3;
  readonly shapeDetailOffset: Vector3;
  readonly shapeDetailVelocity: Vector3;
  readonly turbulenceRepeat: Vector2;
  readonly parameterUniforms: Record<
    | "scatteringCoefficient"
    | "absorptionCoefficient"
    | "turbulenceDisplacement",
    NumberUniform
  >;
  readonly marchNode: {
    scatterAnisotropy1: number;
    scatterAnisotropy2: number;
    scatterAnisotropyMix: number;
  } & Record<
    | "skyLightScale"
    | "groundBounceScale"
    | "powderScale"
    | "powderExponent"
    | "hazeDensityScale"
    | "hazeExponent"
    | "hazeScatteringCoefficient"
    | "hazeAbsorptionCoefficient",
    NumberUniform
  >;
  localWeatherTexture: Texture;
  shapeTexture: Data3DTexture;
  shapeDetailTexture: Data3DTexture;
  turbulenceTexture: Texture;
  stbnTexture: Data3DTexture;
};

export const clouds = vendorClouds as unknown as (
  depth: TextureNode
) => CloudsNode;
