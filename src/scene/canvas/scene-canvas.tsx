import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";

import { CAMERA_DEFAULTS, CANVAS_DPR } from "../render-config";
import { createRenderer } from "./create-renderer";
import { useWebGPUSupport } from "./webgpu-support";

export interface SceneCanvasProps {
  className?: string;
  fallback?: ReactNode;
  children?: ReactNode;
}

export function SceneCanvas({
  className,
  fallback,
  children,
}: SceneCanvasProps) {
  const support = useWebGPUSupport();

  if (support === "checking") return null;
  if (support === "unsupported") return <>{fallback}</>;

  return (
    <Canvas
      className={className}
      gl={createRenderer}
      flat
      shadows="percentage"
      dpr={CANVAS_DPR}
      camera={CAMERA_DEFAULTS}
    >
      {children}
    </Canvas>
  );
}
