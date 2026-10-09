import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import { PerspectiveCamera, type Camera } from "three";

import { useRenderActivity } from "@/scene/canvas/render-activity";

export function CameraFov({ fov }: { fov: number }) {
  const camera = useThree((state) => state.camera);
  const activity = useRenderActivity();

  useLayoutEffect(() => {
    if (applyFov(camera, fov)) activity.wake();
  }, [camera, fov, activity]);

  return null;
}

function applyFov(camera: Camera, fov: number): boolean {
  if (!(camera instanceof PerspectiveCamera) || camera.fov === fov) {
    return false;
  }
  camera.fov = fov;
  camera.updateProjectionMatrix();
  return true;
}
