import type { ComponentType, FC } from "react";

import type { ClipComponentProps } from "@/clips/define-clip";
import type { SceneObjectSpec } from "@/project/types";

export interface SceneObjectProps {
  spec: SceneObjectSpec;
  /** The clip's custom components, for `kind: "custom"`. */
  components?: Readonly<Record<string, ComponentType<ClipComponentProps>>>;
}

// TODO(M1): "primitive" (geometry by shape + createMaterial), registered by id.
// TODO(M4): "model" (useGLTF + AnimationMixer.setTime), "text" (font loaded first).
// TODO(M2): "custom" (components[componentKey]).
export const SceneObject: FC<SceneObjectProps> = () => null;
