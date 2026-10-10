import { useFrame } from "@react-three/fiber";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { loadRapier, type Rapier } from "@/physics/rapier";

import { useRenderActivity } from "../canvas/render-activity";
import { useSceneLoad } from "../canvas/scene-load";
import { PHYSICS_PRIORITY } from "../render-config";
import { useDisposable } from "../use-disposable";
import { createPhysics, type PhysicsHandle } from "./create-physics";

const PhysicsContext = createContext<PhysicsHandle | null>(null);

export function usePhysics(): PhysicsHandle | null {
  return useContext(PhysicsContext);
}

export interface PhysicsProviderProps {
  enabled: boolean;
  children?: ReactNode;
}

type RapierState =
  | { status: "loading" }
  | { status: "ready"; rapier: Rapier }
  | { status: "error"; error: unknown };

export function PhysicsProvider({ enabled, children }: PhysicsProviderProps) {
  const activity = useRenderActivity();
  const load = useSceneLoad();
  const [state, setState] = useState<RapierState>({ status: "loading" });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const task = load.begin("assets");
    loadRapier()
      .then(
        (rapier) => {
          if (!cancelled) setState({ status: "ready", rapier });
        },
        (error: unknown) => {
          if (!cancelled) setState({ status: "error", error });
        }
      )
      .finally(() => task.finish());
    return () => {
      cancelled = true;
      task.finish();
    };
  }, [enabled, load]);

  const rapier = enabled && state.status === "ready" ? state.rapier : null;
  const handle = useMemo(
    () => (rapier === null ? null : createPhysics(rapier)),
    [rapier]
  );
  useDisposable(handle);

  useFrame((_, delta) => {
    if (handle?.update(delta)) activity.wake();
  }, PHYSICS_PRIORITY);

  if (enabled && state.status === "error") throw state.error;

  return (
    <PhysicsContext.Provider value={handle}>{children}</PhysicsContext.Provider>
  );
}
