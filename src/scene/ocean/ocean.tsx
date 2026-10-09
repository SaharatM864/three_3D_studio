import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";

import type { ResolvedOcean } from "@/presets/ocean";

import { useRenderActivity } from "../canvas/render-activity";
import { useRenderQuality } from "../canvas/render-quality";
import { useWebGPURenderer } from "../canvas/use-renderer";
import { useDisposable } from "../use-disposable";
import { createOcean } from "./create-ocean";

export interface OceanProps {
  ocean: ResolvedOcean;
  exposure: number;
}

export function Ocean({ ocean, exposure }: OceanProps) {
  const renderer = useWebGPURenderer();
  const quality = useRenderQuality().ocean;
  const activity = useRenderActivity();

  const handle = useMemo(() => createOcean(renderer), [renderer]);
  useDisposable(handle);

  const [failure, setFailure] = useState<{ error: unknown } | null>(null);
  useEffect(() => {
    let active = true;
    handle.ready.then(
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
  }, [handle, activity]);

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

  if (failure !== null) throw failure.error;

  return <primitive object={handle.mesh} />;
}
