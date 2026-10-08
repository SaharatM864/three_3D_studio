import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";

import { RenderBackendContext } from "../backend/context";
import { useRenderBackendLoader } from "../backend/load-backend";
import type { RenderBackendId } from "../backend/render-backend";
import { CAMERA_DEFAULTS, CANVAS_DPR } from "../render-config";
import { CanvasErrorBoundary } from "./canvas-error-boundary";

export interface SceneCanvasProps {
  backend: RenderBackendId;
  className?: string;
  frameloop?: "always" | "never";
  fallback?: ReactNode;
  children?: ReactNode;
}

export function SceneCanvas({
  backend: backendId,
  className,
  frameloop = "always",
  fallback,
  children,
}: SceneCanvasProps) {
  const state = useRenderBackendLoader(backendId);

  if (state.status === "checking") return null;
  if (state.status === "unsupported") return <>{fallback}</>;
  if (state.status === "error") throw state.error;

  const { backend } = state;

  return (
    <CanvasErrorBoundary key={backend.id} fallback={fallback}>
      <Canvas
        className={className}
        gl={backend.createRenderer}
        frameloop={frameloop}
        flat
        shadows="percentage"
        dpr={CANVAS_DPR}
        camera={CAMERA_DEFAULTS}
      >
        <RenderBackendContext value={backend}>{children}</RenderBackendContext>
      </Canvas>
    </CanvasErrorBoundary>
  );
}
