import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";

import { environmentEpochMs } from "@/presets/environments";
import { evaluateCloudMotion } from "@/timeline/clouds";

import type { RenderStageProps } from "../backend/render-backend";
import { useRenderQuality } from "../canvas/render-quality";
import { RENDER_PRIORITY } from "../render-config";
import { useDisposable } from "../use-disposable";
import { createWebGLStage } from "./create-stage";

export function WebGLStage({ environment }: RenderStageProps) {
  const renderer = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);
  const dpr = useThree((state) => state.viewport.dpr);
  const cloudsQuality = useRenderQuality().clouds;

  const { location, dateTime, exposure, clouds } = environment;
  const hasClouds = clouds !== null;

  const stage = useMemo(
    () => createWebGLStage(renderer, scene, camera, { clouds: hasClouds }),
    [renderer, scene, camera, hasClouds]
  );
  useDisposable(stage);

  const [failure, setFailure] = useState<{ error: unknown } | null>(null);
  useEffect(() => {
    let active = true;
    stage.ready.catch((error: unknown) => {
      if (active) setFailure({ error });
    });
    return () => {
      active = false;
    };
  }, [stage]);

  const { latitude, longitude, height: altitude } = location;
  const epochMs = environmentEpochMs(dateTime);
  useLayoutEffect(() => {
    stage.setEnvironment({
      location: { latitude, longitude, height: altitude },
      epochMs,
    });
  }, [stage, latitude, longitude, altitude, epochMs]);

  useLayoutEffect(() => {
    stage.setExposure(exposure);
  }, [stage, exposure]);

  useLayoutEffect(() => {
    stage.setCloudsQuality(cloudsQuality);
  }, [stage, cloudsQuality]);

  useLayoutEffect(() => {
    if (clouds !== null) stage.setClouds(clouds);
  }, [stage, clouds]);

  useLayoutEffect(() => {
    stage.resize();
  }, [stage, width, height, dpr]);

  useFrame((state) => {
    // TODO(M2): read the time from useClipFrame() instead of the R3F clock.
    if (clouds !== null) {
      stage.setCloudMotion(
        evaluateCloudMotion(clouds, state.clock.elapsedTime)
      );
    }
    stage.render();
  }, RENDER_PRIORITY);

  if (failure !== null) throw failure.error;

  return (
    <>
      <primitive object={stage.sunLight} />
      <primitive object={stage.sunLight.target} />
      <primitive object={stage.skyLight} />
    </>
  );
}
