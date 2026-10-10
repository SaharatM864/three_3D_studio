import { useFrame } from "@react-three/fiber";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  type ReactNode,
} from "react";

import { useRenderActivity } from "../canvas/render-activity";
import type { OceanHandle } from "../ocean/create-ocean";
import { BUOYANCY_PRIORITY } from "../render-config";
import { useDisposable } from "../use-disposable";
import { createBuoyancy, type BuoyancyHandle } from "./create-buoyancy";

const BuoyancyContext = createContext<BuoyancyHandle | null>(null);

export function useBuoyancy(): BuoyancyHandle | null {
  return useContext(BuoyancyContext);
}

export interface BuoyancyProviderProps {
  ocean: OceanHandle | null;
  enabled: boolean;
  children?: ReactNode;
}

export function BuoyancyProvider({
  ocean,
  enabled,
  children,
}: BuoyancyProviderProps) {
  const activity = useRenderActivity();
  const handle = useMemo(() => (enabled ? createBuoyancy() : null), [enabled]);
  useDisposable(handle);

  useLayoutEffect(() => {
    handle?.setOcean(ocean);
  }, [handle, ocean]);

  useFrame((_, delta) => {
    if (handle?.update(delta)) activity.wake();
  }, BUOYANCY_PRIORITY);

  return (
    <BuoyancyContext.Provider value={handle}>
      {children}
    </BuoyancyContext.Provider>
  );
}
