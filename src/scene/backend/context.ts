import { createContext, useContext } from "react";

import type { RenderBackend } from "./render-backend";

export const RenderBackendContext = createContext<RenderBackend | null>(null);

export function useRenderBackend(): RenderBackend {
  const backend = useContext(RenderBackendContext);
  if (backend === null) {
    throw new Error("useRenderBackend() must be used inside SceneCanvas");
  }
  return backend;
}
