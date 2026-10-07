import type { Object3D } from "three";

import { notImplemented } from "@/lib/not-implemented";
import type { EvaluatedCamera, EvaluatedSceneContent } from "@/timeline/types";

/**
 * Imperative link between evaluated values and three.js objects. Scene
 * components register their objects by spec id; `apply` writes one frame's
 * values directly, without going through React state.
 */
export interface RenderBridge {
  /** Returns an unregister function. */
  register(id: string, object: Object3D): () => void;
  /** The playground passes no camera; the player controls it. */
  apply(values: EvaluatedSceneContent & { camera?: EvaluatedCamera }): void;
}

export type CreateRenderBridge = () => RenderBridge;

// TODO(M1): Map<id, Object3D>; apply camera, lights, transforms and material values.
export const createRenderBridge: CreateRenderBridge = () =>
  notImplemented("scene/createRenderBridge");
