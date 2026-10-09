import { Vector2, type Camera, type Scene } from "three";
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

import { createAerialPerspective } from "../atmosphere/create-aerial-perspective";
import type { NightSky } from "../atmosphere/night";
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
  setNightSky(sky: NightSky): void;
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
  const depthNode = passNode.getTextureNode("depth");
  const clouds = options.clouds
    ? createClouds(depthNode, { reversedDepth: renderer.reversedDepthBuffer })
    : null;
  const aerial = createAerialPerspective(
    colorNode,
    depthNode,
    clouds?.shadowLength ?? null
  );
  const lensFlareNode = lensFlare(
    clouds?.composite(aerial.node) ?? aerial.node
  );
  const toneMappedNode = convertToTexture(
    toneMapping(TONE_MAPPING, exposureNode, lensFlareNode)
  );
  const taaNode = temporalAntialias(
    toneMappedNode,
    depthNode,
    passNode.getTextureNode("velocity"),
    camera
  );
  const pipeline = new RenderPipeline(
    renderer,
    renderOutput(taaNode).add(dithering)
  );
  pipeline.outputColorTransform = false;

  const drawingBufferSize = new Vector2();
  const featuresSize = new Vector2();

  function fitLensFlareFeatures(): void {
    renderer.getDrawingBufferSize(drawingBufferSize);
    const width = Math.ceil(drawingBufferSize.x / 2) * 2;
    const height = Math.ceil(drawingBufferSize.y / 2) * 2;
    if (featuresSize.x === width && featuresSize.y === height) return;
    featuresSize.set(width, height);
    lensFlareNode.featuresNode.setSize(width, height);
  }

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
      if (!isReady) return;
      fitLensFlareFeatures();
      pipeline.render();
    },

    setExposure(exposure) {
      exposureNode.value = exposure;
    },

    setNightSky(sky) {
      if (aerial.setNightSky(sky)) pipeline.needsUpdate = true;
    },

    dispose() {
      pipeline.dispose();
      taaNode.dispose();
      toneMappedNode.renderTarget?.dispose();
      toneMappedNode.dispose();
      lensFlareNode.featuresNode.renderTarget?.dispose();
      lensFlareNode.inputNode.renderTarget?.dispose();
      lensFlareNode.inputNode.dispose();
      lensFlareNode.dispose();
      aerial.dispose();
      clouds?.dispose();
      passNode.dispose();
    },
  };
}
