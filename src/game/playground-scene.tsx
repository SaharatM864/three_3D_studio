import { useMemo } from "react";

import type { PlaygroundSpec, SceneSpec, Vec3 } from "@/model/types";
import { applyEnvironmentPreset } from "@/presets/environments";
import { lightingPresets } from "@/presets/lighting";
import { applyOceanOverride, applyUnderwaterOverride } from "@/presets/ocean";
import { CameraRig } from "@/scene/camera/camera-rig";
import {
  ORBIT_PROFILE,
  type CameraPose,
  type CameraProfile,
} from "@/scene/camera/camera-system";
import { BuoyancyDebug } from "@/scene/buoyancy/buoyancy-debug";
import type { SceneComponents } from "@/scene/custom-components";
import { SceneContent } from "@/scene/scene-content";
import { usePlaygroundSettingsStore } from "@/stores/playground-settings-store";
import { usePlaygroundStore } from "@/stores/playground-store";
import { evaluateScene } from "@/timeline/evaluate";

import type { OrbitSettings } from "./settings";

export interface PlaygroundSceneProps {
  scene: SceneSpec;
  playground: PlaygroundSpec;
  components?: SceneComponents;
}

// TODO(G1): <Physics timeStep={PHYSICS_TIME_STEP} gravity={GRAVITY}> around
// <SceneContent/>, a fixed collider per object from playground.colliders
// (default "cuboid" for primitive/model, "none" otherwise) and
// <PlayerController spawn={playground.spawn}/> driving <CameraRig/> in first
// person; provide ClipClockContext with a real-time clock.
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
  const showBuoyancy = usePlaygroundSettingsStore((s) => s.debug.showBuoyancy);

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
  const home = useMemo(() => orbitHome(playground.spawn), [playground.spawn]);
  const profile = useMemo(() => toOrbitProfile(orbit), [orbit]);

  return (
    <>
      <SceneContent
        spec={spec}
        evaluated={evaluated}
        components={components}
        exposureCompensation={view.exposureCompensation}
        simulateBuoyancy
      >
        {showBuoyancy && <BuoyancyDebug />}
      </SceneContent>
      <CameraRig home={home} profile={profile} fov={view.fov} />
    </>
  );
}

function orbitHome(spawn: Vec3): CameraPose {
  return { position: spawn, target: [0, spawn[1], 0] };
}

function toOrbitProfile(orbit: OrbitSettings): CameraProfile {
  return {
    ...ORBIT_PROFILE,
    azimuthRotateSpeed: ORBIT_PROFILE.azimuthRotateSpeed * orbit.rotateSpeed,
    polarRotateSpeed: ORBIT_PROFILE.polarRotateSpeed * orbit.rotateSpeed,
    dollySpeed: ORBIT_PROFILE.dollySpeed * orbit.zoomSpeed,
    truckSpeed: ORBIT_PROFILE.truckSpeed * orbit.panSpeed,
    smoothTime: orbit.damping ? ORBIT_PROFILE.smoothTime : 0,
    draggingSmoothTime: orbit.damping ? ORBIT_PROFILE.draggingSmoothTime : 0,
  };
}
