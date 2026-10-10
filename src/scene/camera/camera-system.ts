import type { PerspectiveCamera } from "three";

import type { Vec3 } from "@/model/types";

import { CAMERA_MAX_DELTA, CAMERA_SMOOTHING } from "../render-config";
import type { Disposable } from "../use-disposable";
import { CameraControls } from "./camera-controls";

export type CameraMouseButtons = CameraControls["mouseButtons"];
export type CameraTouches = CameraControls["touches"];

export interface CameraPose {
  position: Vec3;
  target: Vec3;
}

export interface CameraProfile {
  mouseButtons: CameraMouseButtons;
  touches: CameraTouches;
  smoothTime: number;
  draggingSmoothTime: number;
  azimuthRotateSpeed: number;
  polarRotateSpeed: number;
  dollySpeed: number;
  truckSpeed: number;
  minDistance: number;
  maxDistance: number;
}

const ACTION = CameraControls.ACTION;

export const ORBIT_PROFILE: CameraProfile = {
  mouseButtons: {
    left: ACTION.ROTATE,
    middle: ACTION.DOLLY,
    right: ACTION.TRUCK,
    wheel: ACTION.DOLLY,
  },
  touches: {
    one: ACTION.TOUCH_ROTATE,
    two: ACTION.TOUCH_DOLLY_TRUCK,
    three: ACTION.TOUCH_TRUCK,
  },
  ...CAMERA_SMOOTHING,
  azimuthRotateSpeed: 1,
  polarRotateSpeed: 1,
  dollySpeed: 1,
  truckSpeed: 2,
  minDistance: Number.EPSILON,
  maxDistance: Infinity,
};

const WAKE_EVENTS = [
  "controlstart",
  "control",
  "transitionstart",
  "update",
  "wake",
] as const;

export interface CameraSystem extends Disposable {
  connect(element: HTMLElement): () => void;
  setProfile(profile: CameraProfile): void;
  setPose(pose: CameraPose, transition: boolean): void;
  setFov(fov: number): void;
  update(delta: number): void;
  subscribe(listener: () => void): () => void;
}

export function createCameraSystem(camera: PerspectiveCamera): CameraSystem {
  const controls = new CameraControls(camera);
  const listeners = new Set<() => void>();

  function notify(): void {
    for (const listener of listeners) listener();
  }

  for (const type of WAKE_EVENTS) controls.addEventListener(type, notify);

  return {
    connect(element) {
      controls.connect(element);
      return () => {
        controls.disconnect();
      };
    },

    setProfile(profile) {
      controls.mouseButtons = { ...profile.mouseButtons };
      controls.touches = { ...profile.touches };
      controls.smoothTime = profile.smoothTime;
      controls.draggingSmoothTime = profile.draggingSmoothTime;
      controls.azimuthRotateSpeed = profile.azimuthRotateSpeed;
      controls.polarRotateSpeed = profile.polarRotateSpeed;
      controls.dollySpeed = profile.dollySpeed;
      controls.truckSpeed = profile.truckSpeed;
      controls.minDistance = profile.minDistance;
      controls.maxDistance = profile.maxDistance;
      notify();
    },

    setPose({ position, target }, transition) {
      assertPose(position, target);
      void controls.setLookAt(...position, ...target, transition);
      if (!transition) controls.update(0);
      notify();
    },

    setFov(fov) {
      if (camera.fov === fov) return;
      camera.fov = fov;
      camera.updateProjectionMatrix();
      notify();
    },

    update(delta) {
      controls.update(Math.min(Math.max(delta, 0), CAMERA_MAX_DELTA));
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    dispose() {
      listeners.clear();
      controls.dispose();
    },
  };
}

function assertPose(position: Vec3, target: Vec3): void {
  if (![...position, ...target].every(Number.isFinite)) {
    throw new Error(
      `Camera pose must be finite: position ${position.join(", ")}, target ${target.join(", ")}`
    );
  }
  const [px, py, pz] = position;
  const [tx, ty, tz] = target;
  if (Math.hypot(px - tx, py - ty, pz - tz) === 0) {
    throw new Error(
      `Camera position and target must differ: ${position.join(", ")}`
    );
  }
}
