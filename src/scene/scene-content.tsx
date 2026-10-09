import { useLayoutEffect, useMemo } from "react";

import type { SceneSpec } from "@/model/types";
import { environmentEpochMs, resolveEnvironment } from "@/presets/environments";
import type { EvaluatedSceneContent } from "@/timeline/types";

import { Atmosphere } from "./atmosphere/atmosphere";
import { CelestialLight } from "./atmosphere/celestial-light";
import { SkyEnvironment } from "./atmosphere/sky-environment";
import { useRenderActivity } from "./canvas/render-activity";
import type { SceneComponents } from "./custom-components";
import { LightRig } from "./lights/light-rig";
import { SceneObject } from "./objects/scene-object";
import { Ocean, useOceanHandle } from "./ocean/ocean";
import { ScenePipeline } from "./pipeline/scene-pipeline";

export interface SceneContentProps {
  spec: SceneSpec;
  evaluated: EvaluatedSceneContent;
  components?: SceneComponents;
  exposureCompensation?: number;
}

// TODO(M1): register lights and objects with the render bridge so the clip
// can apply evaluateClip(clip, frame) to them every frame.
export function SceneContent({
  spec,
  evaluated,
  components,
  exposureCompensation = 0,
}: SceneContentProps) {
  const activity = useRenderActivity();
  const environment = useMemo(
    () => resolveEnvironment(spec.environment),
    [spec.environment]
  );
  const exposure = environment.exposure * 2 ** exposureCompensation;
  const ocean = useOceanHandle(environment.ocean !== null);

  useLayoutEffect(() => {
    activity.wake();
  }, [activity, spec, evaluated]);

  return (
    <>
      <Atmosphere
        location={environment.location}
        epochMs={environmentEpochMs(environment.dateTime)}
      >
        <SkyEnvironment />
        <CelestialLight />
        <ScenePipeline
          exposure={exposure}
          clouds={environment.clouds}
          water={ocean?.underwater ?? null}
        />
        {ocean && environment.ocean && (
          <Ocean handle={ocean} ocean={environment.ocean} exposure={exposure} />
        )}
      </Atmosphere>
      <LightRig lights={spec.lights} values={evaluated.lights} />
      {spec.objects.map((object, index) => (
        <SceneObject
          key={object.id}
          spec={object}
          values={evaluated.objects[index]}
          components={components}
        />
      ))}
    </>
  );
}
