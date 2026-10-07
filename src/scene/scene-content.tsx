import type { FC } from "react";

import type { SceneSpec } from "@/model/types";

import type { SceneComponents } from "./custom-components";

export interface SceneContentProps {
  spec: SceneSpec;
  /** Custom components for `kind: "custom"` objects. */
  components?: SceneComponents;
}

/**
 * Mounts a scene's structure: environment, lights and objects. Shared by the
 * Studio clip canvas and the Playground. Values that change per frame are
 * written later through the render bridge.
 */
// TODO(M1): <EnvironmentRenderer/>, <LightRig/> and one <SceneObject/> per
// spec, all registered with the render bridge.
export const SceneContent: FC<SceneContentProps> = () => null;
