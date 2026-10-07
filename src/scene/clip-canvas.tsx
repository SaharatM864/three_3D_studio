import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";

import type { VideoSettings } from "@/model/types";

export interface ClipCanvasProps {
  video: VideoSettings;
  className?: string;
  children?: ReactNode;
}

/** The canvas that preview renders into and export captures from. */
export function ClipCanvas({ video, className, children }: ClipCanvasProps) {
  // TODO(M1): frameloop="never" driven by frame-driver; while exporting pin
  // dpr to 1 and the drawing buffer to video.width × video.height.
  return (
    <div
      className={className}
      style={{ aspectRatio: `${video.width} / ${video.height}` }}
    >
      <Canvas>{children}</Canvas>
    </div>
  );
}
