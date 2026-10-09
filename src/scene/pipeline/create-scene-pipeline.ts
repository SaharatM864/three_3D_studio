import type { Camera, Scene } from "three";
import {
  convertToTexture,
  mrt,
  output,
  pass,
  renderOutput,
  toneMapping,
  uniform,
} from "three/tsl";
import { RenderPipeline, type WebGPURenderer } from "three/webgpu";

import { createClouds, type CloudsHandle } from "../clouds/create-clouds";
import { TONE_MAPPING } from "../render-config";
import type { Disposable } from "../use-disposable";
import {
  dithering,
  highpVelocity,
  lensFlare,
  temporalAntialias,
} from "./takram";

export interface ScenePipelineOptions {
  clouds: boolean;
}

export interface ScenePipelineHandle extends Disposable {
  readonly ready: Promise<void>;
  readonly clouds: CloudsHandle | null;
  render(): void;
  setExposure(exposure: number): void;
}

export function createScenePipeline(
  renderer: WebGPURenderer,
  scene: Scene,
  camera: Camera,
  options: ScenePipelineOptions
): ScenePipelineHandle {
  const exposureNode = uniform(1);
  const passNode = pass(scene, camera, { samples: 0 }).setMRT(
    mrt({ output, velocity: highpVelocity })
  );
  const colorNode = passNode.getTextureNode("output");
  const clouds = options.clouds
    ? createClouds(passNode.getTextureNode("depth"))
    : null;
  const lensFlareNode = lensFlare(clouds?.composite(colorNode) ?? colorNode);
  const toneMappedNode = convertToTexture(
    toneMapping(TONE_MAPPING, exposureNode, lensFlareNode)
  );
  const taaNode = temporalAntialias(
    toneMappedNode,
    passNode.getTextureNode("depth"),
    passNode.getTextureNode("velocity"),
    camera
  );
  const pipeline = new RenderPipeline(
    renderer,
    renderOutput(taaNode).add(dithering)
  );
  pipeline.outputColorTransform = false;

  const ready = clouds?.ready ?? Promise.resolve();
  let isReady = clouds === null;
  void ready.then(
    () => {
      isReady = true;
    },
    () => {}
  );

  return {
    ready,
    clouds,

    render() {
      if (isReady) pipeline.render();
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
      clouds?.dispose();
      passNode.dispose();
    },
  };
}
