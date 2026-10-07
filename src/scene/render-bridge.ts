import type { Object3D } from "three";

import { notImplemented } from "@/lib/not-implemented";
import type { EvaluatedCamera, EvaluatedSceneContent } from "@/timeline/types";

export interface RenderBridge {
  register(id: string, object: Object3D): () => void;
  apply(values: EvaluatedSceneContent & { camera?: EvaluatedCamera }): void;
}

export type CreateRenderBridge = () => RenderBridge;

// TODO(M1): Map<id, Object3D>; apply camera, lights, transforms and material values.
export const createRenderBridge: CreateRenderBridge = () =>
  notImplemented("scene/createRenderBridge");
