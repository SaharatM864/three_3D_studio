import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";

import { useWebGPURenderer } from "../canvas/use-renderer";
import { useDisposable } from "../use-disposable";
import { createScenePipeline } from "./create-scene-pipeline";

export function ScenePipeline({ exposure }: { exposure: number }) {
  const renderer = useWebGPURenderer();
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);

  const pipeline = useMemo(
    () => createScenePipeline(renderer, scene, camera),
    [renderer, scene, camera]
  );
  useDisposable(pipeline);

  useEffect(() => {
    pipeline.setExposure(exposure);
  }, [pipeline, exposure]);

  useFrame(() => pipeline.render(), 1);

  return null;
}
