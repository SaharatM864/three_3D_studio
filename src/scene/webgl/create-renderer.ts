import { WebGLRenderer } from "three";

import { WebGLUnavailableError } from "./support";

export async function createWebGLRenderer({
  canvas,
}: {
  canvas: EventTarget;
}): Promise<WebGLRenderer> {
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("SceneCanvas needs an HTMLCanvasElement");
  }

  try {
    return new WebGLRenderer({
      canvas,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });
  } catch (cause) {
    throw new WebGLUnavailableError({ cause });
  }
}
