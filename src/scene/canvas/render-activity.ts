import { createContext, useContext } from "react";
import { OrthographicCamera, PerspectiveCamera, type Camera } from "three";

import { IDLE_SETTLE_FRAMES } from "../render-config";

export interface RenderActivity {
  bind(invalidate: () => void): () => void;
  wake(): void;
  tick(changed: boolean): boolean;
}

export function createRenderActivity(
  settleFrames = IDLE_SETTLE_FRAMES
): RenderActivity {
  let remaining = settleFrames;
  let invalidate: (() => void) | null = null;

  return {
    bind(next) {
      invalidate = next;
      next();
      return () => {
        if (invalidate === next) invalidate = null;
      };
    },

    wake() {
      remaining = settleFrames;
      invalidate?.();
    },

    tick(changed) {
      if (changed) remaining = settleFrames;
      if (remaining === 0) return false;
      remaining -= 1;
      return true;
    },
  };
}

export const RenderActivityContext = createContext<RenderActivity | null>(null);

export function useRenderActivity(): RenderActivity {
  const activity = useContext(RenderActivityContext);
  if (activity === null) {
    throw new Error("useRenderActivity() must be used inside <SceneCanvas>");
  }
  return activity;
}

export interface ViewSnapshot {
  update(camera: Camera, pixelRatio: number): boolean;
}

const VIEW_VALUES = 24;

export function createViewSnapshot(): ViewSnapshot {
  const previous = new Float64Array(VIEW_VALUES).fill(Number.NaN);
  const current = new Float64Array(VIEW_VALUES);

  return {
    update(camera, pixelRatio) {
      readView(camera, pixelRatio, current);
      let changed = false;
      for (let index = 0; index < VIEW_VALUES; index++) {
        if (current[index] !== previous[index]) changed = true;
      }
      previous.set(current);
      return changed;
    },
  };
}

function readView(camera: Camera, pixelRatio: number, out: Float64Array): void {
  camera.updateMatrixWorld();
  out.set(camera.matrixWorld.elements);
  out[16] = pixelRatio;
  if (camera instanceof PerspectiveCamera) {
    out[17] = camera.fov;
    out[18] = camera.aspect;
    out[19] = camera.zoom;
    out[20] = camera.near;
    out[21] = camera.far;
  } else if (camera instanceof OrthographicCamera) {
    out[17] = camera.left;
    out[18] = camera.right;
    out[19] = camera.top;
    out[20] = camera.bottom;
    out[21] = camera.zoom;
    out[22] = camera.near;
    out[23] = camera.far;
  }
}
