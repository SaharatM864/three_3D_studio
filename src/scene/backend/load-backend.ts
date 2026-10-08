import { useEffect, useState } from "react";

import type { RenderBackend, RenderBackendId } from "./render-backend";

const renderBackendLoaders: Record<
  RenderBackendId,
  () => Promise<RenderBackend>
> = {
  webgpu: () => import("./webgpu").then((module) => module.webgpuBackend),
  webgl: () => import("../webgl").then((module) => module.webglBackend),
};

export type RenderBackendState =
  | { status: "checking" }
  | { status: "unsupported" }
  | { status: "ready"; backend: RenderBackend }
  | { status: "error"; error: unknown };

const CHECKING: RenderBackendState = { status: "checking" };

export function useRenderBackendLoader(
  id: RenderBackendId
): RenderBackendState {
  const [loaded, setLoaded] = useState<{
    id: RenderBackendId;
    state: RenderBackendState;
  } | null>(null);

  useEffect(() => {
    let active = true;
    loadRenderBackend(id).then(
      (state) => {
        if (active) setLoaded({ id, state });
      },
      (error: unknown) => {
        if (active) setLoaded({ id, state: { status: "error", error } });
      }
    );
    return () => {
      active = false;
    };
  }, [id]);

  return loaded?.id === id ? loaded.state : CHECKING;
}

async function loadRenderBackend(
  id: RenderBackendId
): Promise<RenderBackendState> {
  const backend = await renderBackendLoaders[id]();
  return (await backend.detectSupport())
    ? { status: "ready", backend }
    : { status: "unsupported" };
}
