import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";

import type { ResolvedClouds } from "@/presets/clouds";
import { evaluateCloudMotion } from "@/timeline/clouds";

import { useRenderQuality } from "../canvas/render-quality";
import { useWebGPURenderer } from "../canvas/use-renderer";
import { RENDER_PRIORITY } from "../render-config";
import { useDisposable } from "../use-disposable";
import { createScenePipeline } from "./create-scene-pipeline";

export interface ScenePipelineProps {
  exposure: number;
  clouds: ResolvedClouds | null;
}

export function ScenePipeline({ exposure, clouds }: ScenePipelineProps) {
  const renderer = useWebGPURenderer();
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const cloudsQuality = useRenderQuality().clouds;
  const hasClouds = clouds !== null;

  const pipeline = useMemo(
    () => createScenePipeline(renderer, scene, camera, { clouds: hasClouds }),
    [renderer, scene, camera, hasClouds]
  );
  useDisposable(pipeline);

  const [failure, setFailure] = useState<{ error: unknown } | null>(null);
  useEffect(() => {
    let active = true;
    pipeline.ready.catch((error: unknown) => {
      if (active) setFailure({ error });
    });
    return () => {
      active = false;
    };
  }, [pipeline]);

  useLayoutEffect(() => {
    pipeline.setExposure(exposure);
  }, [pipeline, exposure]);

  useLayoutEffect(() => {
    pipeline.clouds?.setQuality(cloudsQuality);
  }, [pipeline, cloudsQuality]);

  useLayoutEffect(() => {
    if (clouds !== null) pipeline.clouds?.setClouds(clouds);
  }, [pipeline, clouds]);

  useFrame((state) => {
    // TODO(M2): read the time from useClipFrame() instead of the R3F clock.
    if (clouds !== null) {
      pipeline.clouds?.setMotion(
        evaluateCloudMotion(clouds, state.clock.elapsedTime)
      );
    }
    pipeline.render();
  }, RENDER_PRIORITY);

  if (failure !== null) throw failure.error;

  return null;
}
