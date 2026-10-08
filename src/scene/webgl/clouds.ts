import type { ResolvedClouds } from "@/presets/clouds";
import type { EvaluatedCloudMotion } from "@/timeline/types";

import type { CloudsRenderSettings } from "../render-config";
import type { CloudsEffect } from "./takram";

export function applyCloudsQuality(
  effect: CloudsEffect,
  settings: CloudsRenderSettings
): void {
  effect.qualityPreset = settings.quality;
  effect.temporalUpscale = settings.temporalUpscale;
}

export function applyClouds(
  effect: CloudsEffect,
  clouds: ResolvedClouds
): void {
  const { localWeather, shape, shapeDetail, turbulence, scattering, haze } =
    clouds;

  effect.coverage = clouds.coverage;
  effect.cloudLayers.reset().set(clouds.layers);

  effect.localWeatherRepeat.fromArray(localWeather.repeat);
  effect.shapeRepeat.fromArray(shape.repeat);
  effect.shapeDetailRepeat.fromArray(shapeDetail.repeat);
  effect.turbulenceRepeat.fromArray(turbulence.repeat);
  effect.turbulenceDisplacement = turbulence.displacement;

  effect.localWeatherVelocity.setScalar(0);
  effect.shapeVelocity.setScalar(0);
  effect.shapeDetailVelocity.setScalar(0);

  effect.scatteringCoefficient = scattering.scatteringCoefficient;
  effect.absorptionCoefficient = scattering.absorptionCoefficient;
  effect.scatterAnisotropy1 = scattering.scatterAnisotropy1;
  effect.scatterAnisotropy2 = scattering.scatterAnisotropy2;
  effect.scatterAnisotropyMix = scattering.scatterAnisotropyMix;
  effect.skyLightScale = scattering.skyLightScale;
  effect.groundBounceScale = scattering.groundBounceScale;
  effect.powderScale = scattering.powderScale;
  effect.powderExponent = scattering.powderExponent;

  effect.clouds.hazeDensityScale = haze.densityScale;
  effect.clouds.hazeExponent = haze.exponent;
  effect.clouds.hazeScatteringCoefficient = haze.scatteringCoefficient;
  effect.clouds.hazeAbsorptionCoefficient = haze.absorptionCoefficient;
}

export function applyCloudMotion(
  effect: CloudsEffect,
  motion: EvaluatedCloudMotion
): void {
  effect.localWeatherOffset.fromArray(motion.localWeatherOffset);
  effect.shapeOffset.fromArray(motion.shapeOffset);
  effect.shapeDetailOffset.fromArray(motion.shapeDetailOffset);
}
