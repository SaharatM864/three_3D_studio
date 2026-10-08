import { useMemo } from "react";

import { configureSunShadow } from "../lights/sun-shadow";
import { SUN_SHADOW } from "../render-config";
import { useDisposable } from "../use-disposable";
import { AtmosphereLight } from "./takram";

// TODO(G1): move light.target with the player; the shadow box stays at the origin ± SUN_SHADOW.extent.
export function SunLight() {
  const light = useMemo(() => createSunLight(), []);
  useDisposable(light);

  return (
    <>
      <primitive object={light} />
      <primitive object={light.target} />
    </>
  );
}

function createSunLight(): AtmosphereLight {
  const light = new AtmosphereLight(SUN_SHADOW.distance);
  light.indirect.value = false;
  configureSunShadow(light);
  return light;
}
