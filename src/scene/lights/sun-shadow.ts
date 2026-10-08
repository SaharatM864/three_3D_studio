import type { DirectionalLight } from "three";

import { SUN_SHADOW } from "../render-config";

export function configureSunShadow(light: DirectionalLight): void {
  const { distance, extent, mapSize, normalBias } = SUN_SHADOW;
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
}
