import type { Camera, Scene } from "three";
import {
  convertToTexture,
  mrt,
  output,
  pass,
  toneMapping,
  uniform,
} from "three/tsl";
import { RenderPipeline, type WebGPURenderer } from "three/webgpu";

import { TONE_MAPPING } from "../render-config";
import type { Disposable } from "../use-disposable";
import {
  dithering,
  highpVelocity,
  lensFlare,
  temporalAntialias,
} from "./takram";

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
    mrt({ output, velocity: highpVelocity })
  );
  const lensFlareNode = lensFlare(passNode.getTextureNode("output"));
  const toneMappedNode = convertToTexture(
    toneMapping(TONE_MAPPING, exposureNode, lensFlareNode)
  );
  const taaNode = temporalAntialias(
    toneMappedNode,
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
      toneMappedNode.renderTarget?.dispose();
      toneMappedNode.dispose();
      lensFlareNode.featuresNode.renderTarget?.dispose();
      lensFlareNode.dispose();
      passNode.dispose();
    },
  };
}
