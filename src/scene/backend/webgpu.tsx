import { createRenderer } from "../canvas/create-renderer";
import { detectWebGPU } from "../canvas/webgpu-support";
import { EnvironmentRenderer } from "../environment/environment-renderer";
import { createMaterial } from "../materials/create-material";
import { ScenePipeline } from "../pipeline/scene-pipeline";
import type { RenderBackend, RenderStageProps } from "./render-backend";

function WebGPUStage({ environment }: RenderStageProps) {
  return (
    <>
      <EnvironmentRenderer environment={environment} />
      <ScenePipeline exposure={environment.exposure} />
    </>
  );
}

export const webgpuBackend: RenderBackend = {
  id: "webgpu",
  detectSupport: detectWebGPU,
  createRenderer,
  createMaterial,
  Stage: WebGPUStage,
};
