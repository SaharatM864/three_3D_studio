import { useMemo } from "react";

import type { SceneSpec } from "@/model/types";
import { resolveEnvironment } from "@/presets/environments";
import type { EvaluatedSceneContent } from "@/timeline/types";

import { useRenderBackend } from "./backend/context";
import type { SceneComponents } from "./custom-components";
import { LightRig } from "./lights/light-rig";
import { SceneObject } from "./objects/scene-object";

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
  const { Stage } = useRenderBackend();
  const environment = useMemo(
    () => resolveEnvironment(spec.environment),
    [spec.environment]
  );

  return (
    <>
      <Stage environment={environment} />
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
