import { createContext, useContext } from "react";

export const SCENE_LOAD_STEPS = [
  "renderer",
  "assets",
  "compile",
  "warmup",
] as const;

export type SceneLoadStep = (typeof SCENE_LOAD_STEPS)[number];

export type SceneLoadState =
  | { status: "loading"; step: SceneLoadStep }
  | { status: "ready" }
  | { status: "unavailable" };

export const INITIAL_SCENE_LOAD: SceneLoadState = {
  status: "loading",
  step: "renderer",
};

export interface SceneLoadTask {
  advance(step: SceneLoadStep): void;
  finish(): void;
}

export interface SceneLoad {
  begin(step: SceneLoadStep): SceneLoadTask;
}

export interface SceneLoadTracker extends SceneLoad {
  start(): void;
  markUnavailable(): void;
  subscribe(listener: (state: SceneLoadState) => void): () => void;
}

interface PendingTask {
  step: SceneLoadStep;
}

export function createSceneLoadTracker(): SceneLoadTracker {
  const pending = new Set<PendingTask>();
  const listeners = new Set<(state: SceneLoadState) => void>();
  let state = INITIAL_SCENE_LOAD;
  let started = false;
  let frame = 0;

  function emit(next: SceneLoadState): void {
    if (sameState(state, next)) return;
    state = next;
    for (const listener of listeners) listener(next);
  }

  function evaluate(): void {
    frame = 0;
    if (!started || state.status !== "loading") return;
    const step = earliestStep(pending);
    emit(step === null ? { status: "ready" } : { status: "loading", step });
  }

  function schedule(): void {
    if (frame !== 0 || state.status !== "loading") return;
    frame = requestAnimationFrame(evaluate);
  }

  return {
    begin(step) {
      const task: PendingTask = { step };
      if (state.status === "loading") {
        pending.add(task);
        schedule();
      }
      return {
        advance(next) {
          if (!pending.has(task)) return;
          task.step = next;
          schedule();
        },
        finish() {
          if (pending.delete(task)) schedule();
        },
      };
    },

    start() {
      started = true;
      schedule();
    },

    markUnavailable() {
      if (state.status === "loading") emit({ status: "unavailable" });
    },

    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

function earliestStep(tasks: ReadonlySet<PendingTask>): SceneLoadStep | null {
  for (const step of SCENE_LOAD_STEPS) {
    for (const task of tasks) {
      if (task.step === step) return step;
    }
  }
  return null;
}

function sameState(a: SceneLoadState, b: SceneLoadState): boolean {
  if (a.status === "loading" && b.status === "loading") {
    return a.step === b.step;
  }
  return a.status === b.status;
}

export const SceneLoadContext = createContext<SceneLoad | null>(null);

export function useSceneLoad(): SceneLoad {
  const load = useContext(SceneLoadContext);
  if (load === null) {
    throw new Error("useSceneLoad() must be used inside <SceneCanvas>");
  }
  return load;
}
