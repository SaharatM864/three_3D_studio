import type { OceanClock, OceanMotion } from "./types";

const MAX_STEP_SECONDS = 0.1;

const CLIP_CATCH_UP_SECONDS = 1;
const STEP_EPSILON = 1e-6;

export type OceanStepVisitor = (
  time: number,
  dt: number,
  reset: boolean
) => void;

export interface OceanStepper {
  reset(): void;
  advance(
    timeSeconds: number,
    motion: OceanMotion,
    visit: OceanStepVisitor
  ): boolean;
}

export function createOceanStepper(clock: OceanClock): OceanStepper {
  return clock.kind === "realtime"
    ? createRealtimeStepper()
    : createClipStepper(clock.fps);
}

function createRealtimeStepper(): OceanStepper {
  let last: number | null = null;

  return {
    reset() {
      last = null;
    },

    advance(timeSeconds, { timeScale }, visit) {
      const time = timeSeconds * timeScale;
      const previous = last;
      if (previous === time) return false;
      last = time;
      if (previous === null || time < previous) {
        visit(time, 0, true);
      } else {
        visit(
          time,
          Math.min(time - previous, MAX_STEP_SECONDS * timeScale),
          false
        );
      }
      return true;
    },
  };
}

function createClipStepper(fps: number): OceanStepper {
  const stepSeconds = 1 / fps;
  const stride = Math.max(
    1,
    Math.floor(MAX_STEP_SECONDS / stepSeconds + STEP_EPSILON)
  );
  const catchUpSteps = Math.round(CLIP_CATCH_UP_SECONDS * fps);
  let last: number | null = null;

  return {
    reset() {
      last = null;
    },

    advance(timeSeconds, { timeScale, prerollSeconds }, visit) {
      const target = Math.floor(timeSeconds * fps + STEP_EPSILON);
      const previous = last;
      if (previous === target) return false;
      last = target;
      const scale = stepSeconds * timeScale;

      let step: number;
      if (
        previous !== null &&
        target > previous &&
        target - previous <= catchUpSteps
      ) {
        step = previous;
      } else {
        step = target - Math.ceil(prerollSeconds * fps - STEP_EPSILON);
        visit(step * scale, 0, true);
        while (step + stride <= target) {
          step += stride;
          visit(step * scale, stride * scale, false);
        }
      }
      while (step < target) {
        step += 1;
        visit(step * scale, scale, false);
      }
      return true;
    },
  };
}
