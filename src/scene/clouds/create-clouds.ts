import type { Data3DTexture } from "three";
import { vec4 } from "three/tsl";
import type { Node, NodeBuilder, TextureNode } from "three/webgpu";

import type { ResolvedClouds } from "@/presets/clouds";
import type { EvaluatedCloudMotion } from "@/timeline/types";

import type { CloudsRenderSettings } from "../render-config";
import type { Disposable } from "../use-disposable";
import { loadCloudTextures, type CloudTextures } from "./cloud-textures";
import {
  clouds as createCloudsNode,
  DEFAULT_STBN_URL,
  STBNLoader,
  type CloudsNode,
} from "./three-clouds";

export interface CloudsHandle extends Disposable {
  readonly ready: Promise<void>;
  readonly shadowLength: Node<"vec2">;
  composite(color: Node<"vec4">): Node<"vec4">;
  sunTransmittance(
    positionECEF: Node<"vec3">,
    builder: NodeBuilder
  ): Node<"float">;
  setClouds(clouds: ResolvedClouds): void;
  setQuality(settings: CloudsRenderSettings): void;
  setMotion(motion: EvaluatedCloudMotion): void;
}

interface CloudAssets extends Disposable {
  textures: CloudTextures;
  stbn: Data3DTexture;
}

export interface CloudsDepthOptions {
  reversedDepth: boolean;
}

export function createClouds(
  depth: TextureNode,
  { reversedDepth }: CloudsDepthOptions
): CloudsHandle {
  const node = createCloudsNode(depth, {
    depth: { mode: reversedDepth ? "reversed-z" : "conventional" },
  });
  node.localWeatherVelocity.setScalar(0);
  node.shapeVelocity.setScalar(0);
  node.shapeDetailVelocity.setScalar(0);

  let disposed = false;
  let assets: CloudAssets | null = null;

  const ready = loadCloudAssets().then((loaded) => {
    if (disposed) {
      loaded.dispose();
      return;
    }
    assets = loaded;
    node.localWeatherTexture = loaded.textures.localWeather;
    node.shapeTexture = loaded.textures.shape;
    node.shapeDetailTexture = loaded.textures.shapeDetail;
    node.turbulenceTexture = loaded.textures.turbulence;
    node.stbnTexture = loaded.stbn;
  });
  ready.catch(() => {});

  return {
    ready,
    shadowLength: node.getShadowLengthNode(),

    composite(color) {
      return vec4(color.rgb.mul(node.a.oneMinus()).add(node.rgb), 1);
    },

    setClouds(clouds) {
      applyClouds(node, clouds);
    },

    sunTransmittance(positionECEF, builder) {
      return node.getSunTransmittanceNode(positionECEF, builder);
    },

    setQuality(settings) {
      node.qualityPreset = settings.quality;
      node.temporalUpscale = settings.temporalUpscale;
    },

    setMotion(motion) {
      node.localWeatherOffset.fromArray(motion.localWeatherOffset);
      node.shapeOffset.fromArray(motion.shapeOffset);
      node.shapeDetailOffset.fromArray(motion.shapeDetailOffset);
    },

    dispose() {
      disposed = true;
      node.dispose();
      assets?.dispose();
    },
  };
}

function applyClouds(node: CloudsNode, clouds: ResolvedClouds): void {
  const { localWeather, shape, shapeDetail, turbulence, scattering, haze } =
    clouds;
  const { parameterUniforms, marchNode } = node;

  node.coverage = clouds.coverage;
  node.cloudLayers.reset();
  node.setCloudLayers(clouds.layers);

  node.localWeatherRepeat.fromArray(localWeather.repeat);
  node.shapeRepeat.fromArray(shape.repeat);
  node.shapeDetailRepeat.fromArray(shapeDetail.repeat);
  node.turbulenceRepeat.fromArray(turbulence.repeat);
  parameterUniforms.turbulenceDisplacement.value = turbulence.displacement;

  parameterUniforms.scatteringCoefficient.value =
    scattering.scatteringCoefficient;
  parameterUniforms.absorptionCoefficient.value =
    scattering.absorptionCoefficient;
  marchNode.scatterAnisotropy1 = scattering.scatterAnisotropy1;
  marchNode.scatterAnisotropy2 = scattering.scatterAnisotropy2;
  marchNode.scatterAnisotropyMix = scattering.scatterAnisotropyMix;
  marchNode.skyLightScale.value = scattering.skyLightScale;
  marchNode.groundBounceScale.value = scattering.groundBounceScale;
  marchNode.powderScale.value = scattering.powderScale;
  marchNode.powderExponent.value = scattering.powderExponent;

  marchNode.hazeDensityScale.value = haze.densityScale;
  marchNode.hazeExponent.value = haze.exponent;
  marchNode.hazeScatteringCoefficient.value = haze.scatteringCoefficient;
  marchNode.hazeAbsorptionCoefficient.value = haze.absorptionCoefficient;
}

async function loadCloudAssets(): Promise<CloudAssets> {
  // TODO(future): self-host stbn.bin (same-origin) once its license is cleared (takram issue #117).
  const [textures, stbn] = await Promise.allSettled([
    loadCloudTextures(),
    new STBNLoader().loadAsync(DEFAULT_STBN_URL),
  ]);
  if (textures.status === "rejected") {
    if (stbn.status === "fulfilled") stbn.value.dispose();
    throw textures.reason;
  }
  if (stbn.status === "rejected") {
    textures.value.dispose();
    throw stbn.reason;
  }

  const cloudTextures = textures.value;
  const stbnTexture = stbn.value;
  return {
    textures: cloudTextures,
    stbn: stbnTexture,
    dispose() {
      cloudTextures.dispose();
      stbnTexture.dispose();
    },
  };
}
