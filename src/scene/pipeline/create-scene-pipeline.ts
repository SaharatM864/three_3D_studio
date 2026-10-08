import type { Camera, Scene } from "three";
import { mrt, output, pass, toneMapping, uniform, velocity } from "three/tsl";
import { RenderPipeline, type WebGPURenderer } from "three/webgpu";

import { TONE_MAPPING } from "../render-config";
import type { Disposable } from "../use-disposable";
import { dithering, lensFlare, temporalAntialias } from "./takram";

export interface ScenePipelineHandle extends Disposable {
  render(): void;
  setExposure(exposure: number): void;
}

export function createScenePipeline(
  renderer: WebGPURenderer,
  scene: Scene,
  camera: Camera
): ScenePipelineHandle {
  const exposureNode = uniform(1);
  const passNode = pass(scene, camera, { samples: 0 }).setMRT(
    mrt({ output, velocity })
  );
  const lensFlareNode = lensFlare(passNode.getTextureNode("output"));
  const taaNode = temporalAntialias(
    toneMapping(TONE_MAPPING, exposureNode, lensFlareNode),
    passNode.getTextureNode("depth"),
    passNode.getTextureNode("velocity"),
    camera
  );
  const pipeline = new RenderPipeline(renderer, taaNode.add(dithering));

  return {
    render() {
      pipeline.render();
    },

    setExposure(exposure) {
      exposureNode.value = exposure;
    },

    dispose() {
      pipeline.dispose();
      taaNode.dispose();
      lensFlareNode.dispose();
      passNode.dispose();
    },
  };
}
