import type { FC } from "react";

import type { SceneSpec } from "@/model/types";

import type { SceneComponents } from "./custom-components";

export interface SceneContentProps {
  spec: SceneSpec;
  components?: SceneComponents;
}

// TODO(M1): <EnvironmentRenderer/>, <LightRig/> and one <SceneObject/> per
// spec, all registered with the render bridge.
export const SceneContent: FC<SceneContentProps> = () => null;
