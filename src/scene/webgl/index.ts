import type { RenderBackend } from "../backend/render-backend";
import { createWebGLRenderer } from "./create-renderer";
import { createWebGLMaterial } from "./material";
import { WebGLStage } from "./stage";
import { detectWebGL2 } from "./support";

export const webglBackend: RenderBackend = {
  id: "webgl",
  detectSupport: detectWebGL2,
  createRenderer: createWebGLRenderer,
  createMaterial: createWebGLMaterial,
  Stage: WebGLStage,
};
