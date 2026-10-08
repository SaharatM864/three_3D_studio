import { useMemo } from "react";

import { SUN_SHADOW } from "../render-config";
import { useDisposable } from "../use-disposable";
import { AtmosphereLight } from "./takram";

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
  const { distance, extent, mapSize, normalBias } = SUN_SHADOW;
  const light = new AtmosphereLight(distance);
  light.indirect.value = false;
  light.castShadow = true;
  light.shadow.mapSize.set(mapSize, mapSize);
  light.shadow.normalBias = normalBias;

  const camera = light.shadow.camera;
  camera.left = -extent;
  camera.right = extent;
  camera.top = extent;
  camera.bottom = -extent;
  camera.near = 0;
  camera.far = distance * 2;
  camera.updateProjectionMatrix();
  return light;
}
