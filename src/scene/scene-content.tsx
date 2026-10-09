import { useMemo } from "react";

import type { SceneSpec } from "@/model/types";
import { resolveEnvironment } from "@/presets/environments";
import type { EvaluatedSceneContent } from "@/timeline/types";

import type { SceneComponents } from "./custom-components";
import { EnvironmentRenderer } from "./environment/environment-renderer";
import { LightRig } from "./lights/light-rig";
import { SceneObject } from "./objects/scene-object";
import { ScenePipeline } from "./pipeline/scene-pipeline";

export interface SceneContentProps {
  spec: SceneSpec;
  evaluated: EvaluatedSceneContent;
  components?: SceneComponents;
}

// TODO(M1): register lights and objects with the render bridge so the clip
// can apply evaluateClip(clip, frame) to them every frame.
export function SceneContent({
  spec,
  evaluated,
  components,
}: SceneContentProps) {
  const environment = useMemo(
    () => resolveEnvironment(spec.environment),
    [spec.environment]
  );

  return (
    <>
      <EnvironmentRenderer environment={environment} />
      <ScenePipeline
        exposure={environment.exposure}
        clouds={environment.clouds}
      />
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
