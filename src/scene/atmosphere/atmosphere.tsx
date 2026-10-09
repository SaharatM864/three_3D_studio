import { useThree } from "@react-three/fiber";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  type ReactNode,
} from "react";

import type { GeoLocation } from "@/model/types";

import { useWebGPURenderer } from "../canvas/use-renderer";
import { useDisposable } from "../use-disposable";
import { createAtmosphere, type AtmosphereHandle } from "./create-atmosphere";
import { computeCelestialFrame, type CelestialFrame } from "./geo-frame";

export interface AtmosphereScope {
  handle: AtmosphereHandle;
  celestial: CelestialFrame;
}

const AtmosphereScopeContext = createContext<AtmosphereScope | null>(null);

export function useAtmosphere(): AtmosphereScope {
  const scope = useContext(AtmosphereScopeContext);
  if (scope === null) {
    throw new Error("useAtmosphere() must be used inside <Atmosphere>");
  }
  return scope;
}

export interface AtmosphereProps {
  location: Required<GeoLocation>;
  epochMs: number;
  children?: ReactNode;
}

export function Atmosphere({ location, epochMs, children }: AtmosphereProps) {
  const renderer = useWebGPURenderer();
  const camera = useThree((state) => state.camera);
  const handle = useMemo(() => createAtmosphere(), []);
  useDisposable(handle);

  const { latitude, longitude, height } = location;
  const celestial = useMemo(
    () => computeCelestialFrame({ latitude, longitude, height }, epochMs),
    [latitude, longitude, height, epochMs]
  );

  useLayoutEffect(() => handle.provide(renderer), [handle, renderer]);

  useLayoutEffect(() => {
    handle.setCamera(camera);
  }, [handle, camera]);

  useLayoutEffect(() => {
    handle.setCelestialFrame(celestial);
  }, [handle, celestial]);

  const scope = useMemo(() => ({ handle, celestial }), [handle, celestial]);

  return (
    <AtmosphereScopeContext value={scope}>{children}</AtmosphereScopeContext>
  );
}
