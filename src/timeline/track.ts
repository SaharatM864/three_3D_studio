import { notImplemented } from "@/lib/not-implemented";
import type { Animatable, Track } from "@/model/types";

import type { Lerp } from "./interpolate";

export function isTrack<T>(value: Animatable<T>): value is Track<T> {
  return typeof value === "object" && value !== null && "keyframes" in value;
}

export type EvaluateAnimatable = <T>(
  value: Animatable<T>,
  frame: number,
  lerp: Lerp<T>
) => T;

// TODO(M1)
export const evaluateAnimatable: EvaluateAnimatable = () =>
  notImplemented("timeline/evaluateAnimatable");
