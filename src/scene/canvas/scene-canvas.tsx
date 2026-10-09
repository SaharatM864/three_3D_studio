import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";

import {
  CAMERA_DEFAULTS,
  DEFAULT_RENDER_QUALITY,
  RENDER_QUALITIES,
  type RenderQualityId,
} from "../render-config";
import { CanvasErrorBoundary } from "./canvas-error-boundary";
import { createRenderer } from "./create-renderer";
import { RenderQualityContext } from "./render-quality";
import { useWebGPUSupport } from "./webgpu-support";
import "./three-console";

export interface SceneCanvasProps {
  quality?: RenderQualityId;
  className?: string;
  frameloop?: "always" | "never";
  fallback?: ReactNode;
  children?: ReactNode;
}

export function SceneCanvas({
  quality: qualityId = DEFAULT_RENDER_QUALITY,
  className,
  frameloop = "always",
  fallback,
  children,
}: SceneCanvasProps) {
  const support = useWebGPUSupport();

  if (support === "checking") return null;
  if (support === "unsupported") return <>{fallback}</>;

  const quality = RENDER_QUALITIES[qualityId];

  return (
    <CanvasErrorBoundary fallback={fallback}>
      <Canvas
        className={className}
        gl={createRenderer}
        frameloop={frameloop}
        flat
        shadows="percentage"
        dpr={quality.dpr}
        camera={CAMERA_DEFAULTS}
      >
        <RenderQualityContext value={quality}>{children}</RenderQualityContext>
      </Canvas>
    </CanvasErrorBoundary>
  );
}
