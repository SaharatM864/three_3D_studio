import type { ReactNode } from "react";

import type { VideoSettings } from "@/model/types";

import { SceneCanvas } from "./canvas/scene-canvas";
import type { SceneLoadState } from "./canvas/scene-load";

export interface ClipCanvasProps {
  video: VideoSettings;
  className?: string;
  fallback?: ReactNode;
  onLoadChange?: (state: SceneLoadState) => void;
  children?: ReactNode;
}

export function ClipCanvas({
  video,
  className,
  fallback,
  onLoadChange,
  children,
}: ClipCanvasProps) {
  // TODO(M1): frameloop="never" driven by frame-driver; while exporting pin
  // dpr to 1 and the drawing buffer to video.width × video.height.
  return (
    <div
      className={className}
      style={{ aspectRatio: `${video.width} / ${video.height}` }}
    >
      <SceneCanvas
        maxPixels={video.width * video.height}
        fallback={fallback}
        onLoadChange={onLoadChange}
      >
        {children}
      </SceneCanvas>
    </div>
  );
}
