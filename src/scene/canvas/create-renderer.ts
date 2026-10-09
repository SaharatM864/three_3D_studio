import { WebGPURenderer } from "three/webgpu";

import { registerAtmosphere } from "../atmosphere/create-atmosphere";
import { CLOUDS_REQUIRED_LIMITS } from "../clouds/three-clouds";
import { applyReversedDepthSort } from "./reversed-depth-sort";
import { WebGPUUnavailableError } from "./webgpu-support";

export async function createRenderer({
  canvas,
}: {
  canvas: EventTarget;
}): Promise<WebGPURenderer> {
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("SceneCanvas needs an HTMLCanvasElement");
  }

  const renderer = new WebGPURenderer({
    canvas,
    antialias: false,
    powerPreference: "high-performance",
    reversedDepthBuffer: true,
    requiredLimits: CLOUDS_REQUIRED_LIMITS,
  });

  try {
    await renderer.init();
  } catch (cause) {
    renderer.dispose();
    throw new WebGPUUnavailableError({ cause });
  }

  if (!("isWebGPUBackend" in renderer.backend)) {
    renderer.dispose();
    throw new WebGPUUnavailableError();
  }

  applyReversedDepthSort(renderer);
  registerAtmosphere(renderer);
  return renderer;
}
