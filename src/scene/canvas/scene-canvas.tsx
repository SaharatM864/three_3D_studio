import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";

import { CAMERA_DEFAULTS, CANVAS_DPR } from "../render-config";
import { CanvasErrorBoundary } from "./canvas-error-boundary";
import { createRenderer } from "./create-renderer";
import { useWebGPUSupport } from "./webgpu-support";

export interface SceneCanvasProps {
  className?: string;
  frameloop?: "always" | "never";
  fallback?: ReactNode;
  children?: ReactNode;
}

export function SceneCanvas({
  className,
  frameloop = "always",
  fallback,
  children,
}: SceneCanvasProps) {
  const support = useWebGPUSupport();

  if (support === "checking") return null;
  if (support === "unsupported") return <>{fallback}</>;

  return (
    <CanvasErrorBoundary fallback={fallback}>
      <Canvas
        className={className}
        gl={createRenderer}
        frameloop={frameloop}
        flat
        shadows="percentage"
        dpr={CANVAS_DPR}
        camera={CAMERA_DEFAULTS}
      >
        {children}
      </Canvas>
    </CanvasErrorBoundary>
  );
}
