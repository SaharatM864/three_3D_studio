import { PHYSICS_MAX_STEPS, PHYSICS_STEP } from "./constants";

export interface FixedStepClock {
  readonly step: number;
  readonly alpha: number;
  readonly residual: number;
  advance(delta: number): number;
  reset(): void;
}

const STEP_EPSILON = 1e-6;

export function createFixedStepClock(
  step = PHYSICS_STEP,
  maxSteps = PHYSICS_MAX_STEPS
): FixedStepClock {
  let accumulator = 0;

  return {
    step,

    get alpha() {
      return accumulator / step;
    },

    get residual() {
      return accumulator;
    },

    advance(delta) {
      accumulator = Math.min(accumulator + Math.max(delta, 0), step * maxSteps);
      const steps = Math.floor(accumulator / step + STEP_EPSILON);
      accumulator = Math.max(accumulator - steps * step, 0);
      return steps;
    },

    reset() {
      accumulator = 0;
    },
  };
}
