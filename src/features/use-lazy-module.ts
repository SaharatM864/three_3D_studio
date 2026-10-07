import { useEffect, useState } from "react";

export type LazyModuleState<T> =
  | { status: "loading" }
  | { status: "ready"; module: T }
  | { status: "error"; error: unknown };

/**
 * Load a project module (clip or playground). Pass a stable loader such as
 * `projectLoaders[id].clip`; callers remount with a `key` when the project
 * changes, so the state starts fresh at "loading".
 */
export function useLazyModule<T>(
  load: () => Promise<{ default: T }>
): LazyModuleState<T> {
  const [state, setState] = useState<LazyModuleState<T>>({
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;
    load().then(
      (mod) => {
        if (!cancelled) setState({ status: "ready", module: mod.default });
      },
      (error: unknown) => {
        if (!cancelled) setState({ status: "error", error });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [load]);

  return state;
}
