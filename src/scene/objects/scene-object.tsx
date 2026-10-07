import type { FC } from "react";

import type { SceneObjectSpec } from "@/model/types";

import type { SceneComponents } from "../custom-components";

export interface SceneObjectProps {
  spec: SceneObjectSpec;
  components?: SceneComponents;
}

// TODO(M1): "primitive" (geometry by shape + createMaterial), registered by id.
// TODO(M4): "model" (useGLTF + AnimationMixer.setTime), "text" (font loaded first).
// TODO(M2): "custom" (components[componentKey]).
export const SceneObject: FC<SceneObjectProps> = () => null;
