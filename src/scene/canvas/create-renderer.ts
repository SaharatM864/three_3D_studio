import { WebGPURenderer } from "three/webgpu";

import { registerAtmosphere } from "../atmosphere/create-atmosphere";

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
  await renderer.init();
  registerAtmosphere(renderer);
  return renderer;
}
