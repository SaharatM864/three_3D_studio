import { notImplemented } from "@/lib/not-implemented";
import type { Animatable, Track } from "@/project/types";

import type { Lerp } from "./interpolate";

export function isTrack<T>(value: Animatable<T>): value is Track<T> {
  return typeof value === "object" && value !== null && "keyframes" in value;
}

/**
 * Value of a static or keyframed property at `frame`. Holds the first/last
 * keyframe outside the track range and applies each keyframe's easing.
 */
export type EvaluateAnimatable = <T>(
  value: Animatable<T>,
  frame: number,
  lerp: Lerp<T>
) => T;

// TODO(M1)
export const evaluateAnimatable: EvaluateAnimatable = () =>
  notImplemented("timeline/evaluateAnimatable");
