import type { FC } from "react";

import type { CameraSpec, VideoSettings } from "@/model/types";

export interface ClipCameraProps {
  spec: CameraSpec;
  video: VideoSettings;
}

// TODO(M1): write into the canvas's default camera (never makeDefault a new
// one: atmosphere and pipeline nodes capture the camera at setup). Set
// camera.manual = true and aspect = video.width / video.height, not the
// on-screen size, and register it with the render bridge (position, lookAt
// target, fov).
export const ClipCamera: FC<ClipCameraProps> = () => null;
