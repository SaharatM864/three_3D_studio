import type { FC } from "react";

import type { CameraSpec, VideoSettings } from "@/project/types";

export interface ClipCameraProps {
  spec: CameraSpec;
  /** Aspect ratio comes from the video size, not the on-screen canvas. */
  video: VideoSettings;
}

// TODO(M1): default PerspectiveCamera with aspect = video.width / video.height,
// registered with the render bridge (position, lookAt target, fov).
export const ClipCamera: FC<ClipCameraProps> = () => null;
