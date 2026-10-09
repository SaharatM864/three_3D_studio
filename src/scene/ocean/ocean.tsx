import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";

import type { ResolvedOcean } from "@/presets/ocean";
import type { OceanClock } from "@/timeline/types";

import { useRenderActivity } from "../canvas/render-activity";
import { useRenderQuality } from "../canvas/render-quality";
import { useWebGPURenderer } from "../canvas/use-renderer";
import { useDisposable } from "../use-disposable";
import { createOcean } from "./create-ocean";

const REALTIME_CLOCK: OceanClock = { kind: "realtime" };

export interface OceanProps {
  ocean: ResolvedOcean;
  exposure: number;
}

export function Ocean({ ocean, exposure }: OceanProps) {
  const renderer = useWebGPURenderer();
  const quality = useRenderQuality().ocean;
  const activity = useRenderActivity();

  // TODO(M2): use { kind: "clip", fps } from useClipFrame() in clips.
  const handle = useMemo(
    () => createOcean(renderer, REALTIME_CLOCK),
    [renderer]
  );
  useDisposable(handle);

  useLayoutEffect(() => {
    handle.setQuality(quality);
    activity.wake();
  }, [handle, quality, activity]);

  useLayoutEffect(() => {
    handle.setOcean(ocean);
    activity.wake();
  }, [handle, ocean, activity]);

  useLayoutEffect(() => {
    handle.setExposure(exposure);
    activity.wake();
  }, [handle, exposure, activity]);

  useFrame((state) => {
    // TODO(M2): read the time from useClipFrame() instead of the R3F clock.
    if (handle.update(state.camera, state.clock.elapsedTime)) activity.wake();
  });

  return <primitive object={handle.mesh} />;
}
