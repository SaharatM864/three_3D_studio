import { WebGPURenderer } from "three/webgpu";

import { registerAtmosphere } from "../atmosphere/create-atmosphere";
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

  registerAtmosphere(renderer);
  return renderer;
}
