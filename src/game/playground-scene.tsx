import { useMemo } from "react";

import type { PlaygroundSpec, SceneSpec } from "@/model/types";
import { applyEnvironmentPreset } from "@/presets/environments";
import { lightingPresets } from "@/presets/lighting";
import { applyOceanOverride, applyUnderwaterOverride } from "@/presets/ocean";
import type { SceneComponents } from "@/scene/custom-components";
import { SceneContent } from "@/scene/scene-content";
import { usePlaygroundSettingsStore } from "@/stores/playground-settings-store";
import { usePlaygroundStore } from "@/stores/playground-store";
import { evaluateScene } from "@/timeline/evaluate";

import { CameraFov } from "./camera-fov";
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
  const oceanOverride = usePlaygroundStore((s) => s.oceanOverride);
  const underwaterPresetId = usePlaygroundStore((s) => s.underwaterPresetId);
  const underwaterWhiteBalance = usePlaygroundStore(
    (s) => s.underwaterWhiteBalance
  );
  const view = usePlaygroundSettingsStore((s) => s.view);
  const orbit = usePlaygroundSettingsStore((s) => s.orbit);

  const environment = useMemo(() => {
    const preset = environmentPresetId
      ? applyEnvironmentPreset(scene.environment, environmentPresetId)
      : scene.environment;
    const ocean = oceanOverride
      ? applyOceanOverride(preset, oceanOverride)
      : preset;
    return underwaterPresetId === null && underwaterWhiteBalance === null
      ? ocean
      : applyUnderwaterOverride(ocean, {
          presetId: underwaterPresetId,
          whiteBalance: underwaterWhiteBalance,
        });
  }, [
    scene.environment,
    environmentPresetId,
    oceanOverride,
    underwaterPresetId,
    underwaterWhiteBalance,
  ]);
  const spec = useMemo<SceneSpec>(
    () => ({
      ...scene,
      environment,
      lights: lightingPresetId
        ? lightingPresets[lightingPresetId].lights
        : scene.lights,
    }),
    [scene, environment, lightingPresetId]
  );
  const evaluated = useMemo(() => evaluateScene(spec, 0), [spec]);

  return (
    <>
      <SceneContent
        spec={spec}
        evaluated={evaluated}
        components={components}
        exposureCompensation={view.exposureCompensation}
      />
      <CameraFov fov={view.fov} />
      <InspectCamera spawn={playground.spawn} orbit={orbit} />
    </>
  );
}
