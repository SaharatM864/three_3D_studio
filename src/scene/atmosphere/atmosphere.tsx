import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, type ReactNode } from "react";

import type { GeoLocation } from "@/model/types";

import { useWebGPURenderer } from "../canvas/use-renderer";
import { useDisposable } from "../use-disposable";
import { createAtmosphere } from "./create-atmosphere";

export interface AtmosphereProps {
  location: Required<GeoLocation>;
  epochMs: number;
  children?: ReactNode;
}

export function Atmosphere({ location, epochMs, children }: AtmosphereProps) {
  const renderer = useWebGPURenderer();
  const camera = useThree((state) => state.camera);
  const atmosphere = useMemo(() => createAtmosphere(), []);
  useDisposable(atmosphere);

  useLayoutEffect(() => atmosphere.provide(renderer), [atmosphere, renderer]);

  useLayoutEffect(() => {
    atmosphere.setCamera(camera);
  }, [atmosphere, camera]);

  const { latitude, longitude, height } = location;
  useLayoutEffect(() => {
    atmosphere.setLocation({ latitude, longitude, height });
  }, [atmosphere, latitude, longitude, height]);

  useLayoutEffect(() => {
    atmosphere.setDate(epochMs);
  }, [atmosphere, epochMs]);

  return <>{children}</>;
}
