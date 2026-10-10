import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { ResolvedClouds } from "@/presets/clouds";
import { evaluateCloudMotion, hasCloudMotion } from "@/timeline/clouds";

import { useAtmosphere } from "../atmosphere/atmosphere";
import { nightSky } from "../atmosphere/night";
import {
  createViewSnapshot,
  useRenderActivity,
} from "../canvas/render-activity";
import { useRenderQuality } from "../canvas/render-quality";
import { useSceneLoad } from "../canvas/scene-load";
import { useWebGPURenderer } from "../canvas/use-renderer";
import type { UnderwaterMedium } from "../ocean/create-ocean";
import { RENDER_PRIORITY, SCENE_WARMUP_FRAMES } from "../render-config";
import { useDisposable } from "../use-disposable";
import { createScenePipeline } from "./create-scene-pipeline";

export interface ScenePipelineProps {
  exposure: number;
  clouds: ResolvedClouds | null;
  water: UnderwaterMedium | null;
}

export function ScenePipeline({ exposure, clouds, water }: ScenePipelineProps) {
  const renderer = useWebGPURenderer();
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const { handle: atmosphere, celestial } = useAtmosphere();
  const cloudsQuality = useRenderQuality().clouds;
  const activity = useRenderActivity();
  const load = useSceneLoad();
  const warmup = useRef<(() => void) | null>(null);
  const hasClouds = clouds !== null;
  const cloudsMoving = useMemo(
    () => clouds !== null && hasCloudMotion(clouds),
    [clouds]
  );
  const view = useMemo(() => createViewSnapshot(), []);

  const pipeline = useMemo(
    () =>
      createScenePipeline(renderer, scene, camera, {
        clouds: hasClouds,
        water,
      }),
    [renderer, scene, camera, hasClouds, water]
  );
  useDisposable(pipeline);

  const [failure, setFailure] = useState<{ error: unknown } | null>(null);
  useEffect(() => {
    let active = true;
    pipeline.ready.then(
      () => {
        if (active) activity.wake();
      },
      (error: unknown) => {
        if (active) setFailure({ error });
      }
    );
    return () => {
      active = false;
    };
  }, [pipeline, activity]);

  useEffect(
    () => atmosphere.onLUTUpdate(activity.wake),
    [atmosphere, activity]
  );

  useLayoutEffect(() => {
    const task = load.begin("assets");
    let active = true;
    let remaining = SCENE_WARMUP_FRAMES;
    void pipeline.ready
      .then(() => {
        if (active) task.advance("compile");
        return atmosphere.lutReady;
      })
      .then(
        () => {
          if (!active) return;
          task.advance("warmup");
          warmup.current = () => {
            remaining -= 1;
            if (remaining > 0) return;
            warmup.current = null;
            task.finish();
          };
          activity.wake();
        },
        () => {}
      );
    return () => {
      active = false;
      warmup.current = null;
      task.finish();
    };
  }, [load, pipeline, atmosphere, activity]);

  useLayoutEffect(() => {
    atmosphere.setSunTransmittance(pipeline.clouds);
    activity.wake();
    return () => {
      atmosphere.setSunTransmittance(null);
    };
  }, [atmosphere, pipeline, activity]);

  useLayoutEffect(() => {
    pipeline.setExposure(exposure);
    activity.wake();
  }, [pipeline, exposure, activity]);

  useLayoutEffect(() => {
    pipeline.setNightSky(nightSky(celestial));
    activity.wake();
  }, [pipeline, celestial, activity]);

  useLayoutEffect(() => {
    pipeline.clouds?.setQuality(cloudsQuality);
    activity.wake();
  }, [pipeline, cloudsQuality, activity]);

  useLayoutEffect(() => {
    if (clouds !== null) {
      pipeline.clouds?.setClouds(clouds);
      pipeline.clouds?.setMotion(evaluateCloudMotion(clouds, 0));
    }
    activity.wake();
  }, [pipeline, clouds, activity]);

  useFrame((state) => {
    // TODO(M2): read the time from useClipFrame() instead of the R3F clock.
    if (clouds !== null && cloudsMoving) {
      pipeline.clouds?.setMotion(
        evaluateCloudMotion(clouds, state.clock.elapsedTime)
      );
    }
    const viewChanged = view.update(state.camera, renderer.getPixelRatio());
    if (pipeline.render()) warmup.current?.();
    if (activity.tick(viewChanged || cloudsMoving)) state.invalidate();
  }, RENDER_PRIORITY);

  if (failure !== null) throw failure.error;

  return null;
}
