import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";
import { PerspectiveCamera, type Camera } from "three";

import { useRenderActivity } from "../canvas/render-activity";
import { CAMERA_PRIORITY } from "../render-config";
import { useDisposable } from "../use-disposable";
import {
  createCameraSystem,
  type CameraPose,
  type CameraProfile,
} from "./camera-system";

export interface CameraRigProps {
  home: CameraPose;
  profile: CameraProfile;
  fov: number;
}

export function CameraRig({ home, profile, fov }: CameraRigProps) {
  const camera = useThree((state) => state.camera);
  const element = useThree((state) =>
    inputElement(state.events.connected, state.gl.domElement)
  );
  const activity = useRenderActivity();
  const system = useMemo(
    () => createCameraSystem(requirePerspective(camera)),
    [camera]
  );
  useDisposable(system);

  const [px, py, pz] = home.position;
  const [tx, ty, tz] = home.target;

  useLayoutEffect(
    () => system.subscribe(() => activity.wake()),
    [system, activity]
  );

  useLayoutEffect(() => system.connect(element), [system, element]);

  useLayoutEffect(() => {
    system.setProfile(profile);
  }, [system, profile]);

  useLayoutEffect(() => {
    system.setPose({ position: [px, py, pz], target: [tx, ty, tz] }, false);
  }, [system, px, py, pz, tx, ty, tz]);

  useLayoutEffect(() => {
    system.setFov(fov);
  }, [system, fov]);

  useFrame((_, delta) => {
    system.update(delta);
  }, CAMERA_PRIORITY);

  return null;
}

function requirePerspective(camera: Camera): PerspectiveCamera {
  if (!(camera instanceof PerspectiveCamera)) {
    throw new Error("CameraRig needs the canvas's perspective camera");
  }
  return camera;
}

function inputElement(connected: unknown, canvas: HTMLElement): HTMLElement {
  return connected instanceof HTMLElement ? connected : canvas;
}
