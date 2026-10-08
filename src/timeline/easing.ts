import type { EasingName } from "@/model/types";

export type EasingFn = (t: number) => number;

export type GetEasing = (name: EasingName) => EasingFn;

const easings: Record<EasingName, EasingFn> = {
  linear: (t) => t,
  step: (t) => (t < 1 ? 0 : 1),
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  easeInCubic: (t) => t ** 3,
  easeOutCubic: (t) => 1 - (1 - t) ** 3,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
};

export const getEasing: GetEasing = (name) => easings[name];
