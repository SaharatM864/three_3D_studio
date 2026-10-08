import type { ComponentType } from "react";
import type { WebGLRenderer } from "three";
import type { WebGPURenderer } from "three/webgpu";

import type { ResolvedEnvironment } from "@/presets/environments";

import type { CreateMaterial } from "../materials/material-parameters";

export type RenderBackendId = "webgpu" | "webgl";

export type RenderBackendPreference = "auto" | RenderBackendId;

export const RENDER_BACKEND_LABELS: Record<RenderBackendId, string> = {
  webgpu: "WebGPU",
  webgl: "WebGL 2",
};

export interface RenderStageProps {
  environment: ResolvedEnvironment;
}

export interface RenderBackend {
  id: RenderBackendId;
  detectSupport(): Promise<boolean>;
  createRenderer(props: {
    canvas: EventTarget;
  }): Promise<WebGPURenderer | WebGLRenderer>;
  createMaterial: CreateMaterial;
  Stage: ComponentType<RenderStageProps>;
}

export class RenderBackendUnavailableError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "RenderBackendUnavailableError";
  }
}
