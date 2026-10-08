import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";

import { RenderBackendContext } from "../backend/context";
import { useRenderBackendLoader } from "../backend/load-backend";
import type { RenderBackendId } from "../backend/render-backend";
import {
  CAMERA_DEFAULTS,
  DEFAULT_RENDER_QUALITY,
  RENDER_QUALITIES,
  type RenderQualityId,
} from "../render-config";
import { CanvasErrorBoundary } from "./canvas-error-boundary";
import { RenderQualityContext } from "./render-quality";
import "./three-console";

export interface SceneCanvasProps {
  backend: RenderBackendId;
  quality?: RenderQualityId;
  className?: string;
  frameloop?: "always" | "never";
  fallback?: ReactNode;
  children?: ReactNode;
}

export function SceneCanvas({
  backend: backendId,
  quality: qualityId = DEFAULT_RENDER_QUALITY,
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
  const quality = RENDER_QUALITIES[qualityId];

  return (
    <CanvasErrorBoundary key={backend.id} fallback={fallback}>
      <Canvas
        className={className}
        gl={backend.createRenderer}
        frameloop={frameloop}
        flat
        shadows="percentage"
        dpr={quality.dpr}
        camera={CAMERA_DEFAULTS}
      >
        <RenderBackendContext value={backend}>
          <RenderQualityContext value={quality}>
            {children}
          </RenderQualityContext>
        </RenderBackendContext>
      </Canvas>
    </CanvasErrorBoundary>
  );
}
