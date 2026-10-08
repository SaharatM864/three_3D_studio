import { useMemo } from "react";

import type { PlaygroundSpec, SceneSpec } from "@/model/types";
import { applyEnvironmentPreset } from "@/presets/environments";
import { lightingPresets } from "@/presets/lighting";
import type { SceneComponents } from "@/scene/custom-components";
import { SceneContent } from "@/scene/scene-content";
import { usePlaygroundStore } from "@/stores/playground-store";
import { evaluateScene } from "@/timeline/evaluate";

import { InspectCamera } from "./inspect-camera";

export interface PlaygroundSceneProps {
  scene: SceneSpec;
  playground: PlaygroundSpec;
  components?: SceneComponents;
}

// TODO(G1): <Physics timeStep={PHYSICS_TIME_STEP} gravity={GRAVITY}> around
// <SceneContent/>, a fixed collider per object from playground.colliders
// (default "cuboid" for primitive/model, "none" otherwise) and
// <PlayerController spawn={playground.spawn}/> in place of <InspectCamera/>;
// provide ClipClockContext with a real-time clock.
export function PlaygroundScene({
  scene,
  playground,
  components,
}: PlaygroundSceneProps) {
  const lightingPresetId = usePlaygroundStore((s) => s.lightingPresetId);
  const environmentPresetId = usePlaygroundStore((s) => s.environmentPresetId);

  const spec = useMemo<SceneSpec>(
    () => ({
      ...scene,
      environment: environmentPresetId
        ? applyEnvironmentPreset(scene.environment, environmentPresetId)
        : scene.environment,
      lights: lightingPresetId
        ? lightingPresets[lightingPresetId].lights
        : scene.lights,
    }),
    [scene, lightingPresetId, environmentPresetId]
  );
  const evaluated = useMemo(() => evaluateScene(spec, 0), [spec]);

  return (
    <>
      <SceneContent spec={spec} evaluated={evaluated} components={components} />
      <InspectCamera spawn={playground.spawn} />
    </>
  );
}
