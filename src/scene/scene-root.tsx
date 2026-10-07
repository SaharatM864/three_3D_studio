import type { FC } from "react";

import type { ClipSpec } from "@/model/types";

import type { SceneComponents } from "./custom-components";

export interface SceneRootProps {
  spec: ClipSpec;
  components?: SceneComponents;
}

// TODO(M1): <ClipCamera spec={spec.camera} video={spec.video}/> and
// <SceneContent spec={spec} components={components}/>.
export const SceneRoot: FC<SceneRootProps> = () => null;
