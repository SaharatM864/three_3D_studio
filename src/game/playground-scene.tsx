import type { FC } from "react";

import type { PlaygroundSpec, SceneSpec } from "@/model/types";
import type { SceneComponents } from "@/scene/custom-components";

export interface PlaygroundSceneProps {
  scene: SceneSpec;
  playground: PlaygroundSpec;
  components?: SceneComponents;
}

// TODO(G1): <Physics timeStep={PHYSICS_TIME_STEP} gravity={GRAVITY}> with
// <SceneContent/>, a fixed collider per object from playground.colliders
// (default "cuboid" for primitive/model, "none" otherwise) and
// <PlayerController spawn={playground.spawn}/>; provide ClipClockContext with
// a real-time clock and apply evaluateScene(scene, 0) through a render bridge.
// TODO(G2): lighting/environment overrides from usePlaygroundStore (null = the
// scene's own).
export const PlaygroundScene: FC<PlaygroundSceneProps> = () => null;
