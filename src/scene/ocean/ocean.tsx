import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";

import type { ResolvedOcean } from "@/presets/ocean";
import type { OceanClock } from "@/timeline/types";

import { useAtmosphere } from "../atmosphere/atmosphere";
import { useRenderActivity } from "../canvas/render-activity";
import { useRenderQuality } from "../canvas/render-quality";
import { useWebGPURenderer } from "../canvas/use-renderer";
import { useDisposable } from "../use-disposable";
import { createOcean, type OceanHandle } from "./create-ocean";

const REALTIME_CLOCK: OceanClock = { kind: "realtime" };

export function useOceanHandle(enabled: boolean): OceanHandle | null {
  const renderer = useWebGPURenderer();

  // TODO(M2): use { kind: "clip", fps } from useClipFrame() in clips.
  const handle = useMemo(
    () => (enabled ? createOcean(renderer, REALTIME_CLOCK) : null),
    [renderer, enabled]
  );
  useDisposable(handle);
  return handle;
}

export interface OceanProps {
  handle: OceanHandle;
  ocean: ResolvedOcean;
  exposure: number;
}

export function Ocean({ handle, ocean, exposure }: OceanProps) {
  const quality = useRenderQuality().ocean;
  const activity = useRenderActivity();
  const { handle: atmosphere } = useAtmosphere();

  useLayoutEffect(() => {
    atmosphere.setWaterLight(handle.waterLight);
    activity.wake();
    return () => {
      atmosphere.setWaterLight(null);
    };
  }, [atmosphere, handle, activity]);

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
