import type { ResolvedOcean } from "@/presets/ocean";

import type { OceanStepPlan, OceanStepPolicy } from "./types";

const STEP_EPSILON = 1e-6;

export function oceanStepAt(
  timeSeconds: number,
  { stepSeconds }: OceanStepPolicy
): number {
  return Math.floor(timeSeconds / stepSeconds + STEP_EPSILON);
}

export function planOceanSteps(
  lastStep: number | null,
  timeSeconds: number,
  policy: OceanStepPolicy
): OceanStepPlan | null {
  const target = oceanStepAt(timeSeconds, policy);
  if (lastStep === target) return null;
  if (
    lastStep !== null &&
    target > lastStep &&
    target - lastStep <= policy.maxCatchUpSteps
  ) {
    return { reset: false, firstStep: lastStep + 1, lastStep: target };
  }
  return {
    reset: true,
    firstStep: target - policy.prerollSteps,
    lastStep: target,
  };
}

export function forEachOceanStep(
  { reset, firstStep, lastStep }: OceanStepPlan,
  { prerollStride }: OceanStepPolicy,
  visit: (step: number, span: number) => void
): void {
  let step = firstStep;
  visit(step, reset ? prerollStride : 1);
  if (reset) {
    while (step + prerollStride <= lastStep) {
      step += prerollStride;
      visit(step, prerollStride);
    }
  }
  while (step < lastStep) {
    step += 1;
    visit(step, 1);
  }
}

export function oceanSimulationTime(
  step: number,
  { stepSeconds }: OceanStepPolicy,
  { timeScale }: ResolvedOcean
): number {
  return step * stepSeconds * timeScale;
}

export function oceanSimulationDelta(
  span: number,
  { stepSeconds }: OceanStepPolicy,
  { timeScale }: ResolvedOcean
): number {
  return span * stepSeconds * timeScale;
}

export function hasOceanMotion({ timeScale }: ResolvedOcean): boolean {
  return timeScale > 0;
}
