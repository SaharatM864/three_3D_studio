import type { ReactNode } from "react";

import type { VideoSettings } from "@/model/types";

import { SceneCanvas } from "./canvas/scene-canvas";

export interface ClipCanvasProps {
  video: VideoSettings;
  className?: string;
  children?: ReactNode;
}

export function ClipCanvas({ video, className, children }: ClipCanvasProps) {
  // TODO(M1): frameloop="never" driven by frame-driver; while exporting pin
  // dpr to 1 and the drawing buffer to video.width × video.height.
  return (
    <div
      className={className}
      style={{ aspectRatio: `${video.width} / ${video.height}` }}
    >
      <SceneCanvas>{children}</SceneCanvas>
    </div>
  );
}
