import { useLayoutEffect, useMemo } from "react";

import { useRenderQuality } from "../canvas/render-quality";
import { configureSunShadow } from "../lights/sun-shadow";
import { SUN_SHADOW } from "../render-config";
import { useDisposable } from "../use-disposable";
import { useAtmosphere } from "./atmosphere";
import type { CelestialFrame } from "./geo-frame";
import { isNight, moonLightGain } from "./night";
import { AtmosphereLight } from "./takram";

// TODO(G1): move light.target with the player; the shadow box stays at the origin ± SUN_SHADOW.extent.
export function CelestialLight() {
  const { celestial } = useAtmosphere();
  const { sunShadowMapSize } = useRenderQuality();
  const light = useMemo(() => createCelestialLight(), []);
  useDisposable(light);

  useLayoutEffect(() => {
    light.shadow.mapSize.set(sunShadowMapSize, sunShadowMapSize);
  }, [light, sunShadowMapSize]);

  useLayoutEffect(() => {
    applyCelestialBody(light, celestial);
  }, [light, celestial]);

  return (
    <>
      <primitive object={light} />
      <primitive object={light.target} />
    </>
  );
}

function createCelestialLight(): AtmosphereLight {
  const light = new AtmosphereLight(SUN_SHADOW.distance);
  configureSunShadow(light);
  return light;
}

function applyCelestialBody(
  light: AtmosphereLight,
  frame: CelestialFrame
): void {
  const night = isNight(frame);
  light.body = night ? "moon" : "sun";
  light.indirect.value = night;
  setLinearIntensity(light, night ? moonLightGain(frame) : 1);
}

function setLinearIntensity(light: AtmosphereLight, gain: number): void {
  light.intensity = gain;
  light.color.setScalar(1 / gain);
}
