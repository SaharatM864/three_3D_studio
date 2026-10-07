import type { FC } from "react";

import type { ClipModule } from "@/clips/define-clip";

export interface SceneRootProps {
  clip: ClipModule;
}

/**
 * Mounts a clip's structure: environment, camera, lights and objects. Values
 * that change per frame are written later through the render bridge.
 */
// TODO(M1): <EnvironmentRenderer/>, <ClipCamera/>, <LightRig/> and one
// <SceneObject/> per spec, all registered with the render bridge.
export const SceneRoot: FC<SceneRootProps> = () => null;
