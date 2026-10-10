import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  type ReactNode,
} from "react";

import type { OceanHandle } from "../ocean/create-ocean";
import { usePhysics } from "../physics/physics";
import { useDisposable } from "../use-disposable";
import { createBuoyancy, type BuoyancyHandle } from "./create-buoyancy";

const BuoyancyContext = createContext<BuoyancyHandle | null>(null);

export function useBuoyancy(): BuoyancyHandle | null {
  return useContext(BuoyancyContext);
}

export interface BuoyancyProviderProps {
  ocean: OceanHandle | null;
  children?: ReactNode;
}

export function BuoyancyProvider({ ocean, children }: BuoyancyProviderProps) {
  const physics = usePhysics();
  const handle = useMemo(
    () => (physics === null ? null : createBuoyancy(physics)),
    [physics]
  );
  useDisposable(handle);

  useLayoutEffect(() => {
    handle?.setOcean(ocean);
  }, [handle, ocean]);

  return (
    <BuoyancyContext.Provider value={handle}>
      {children}
    </BuoyancyContext.Provider>
  );
}
