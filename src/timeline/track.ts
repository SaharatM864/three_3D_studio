import type { Animatable, Track } from "@/model/types";

import { getEasing } from "./easing";
import type { Lerp } from "./interpolate";

export function isTrack<T>(value: Animatable<T>): value is Track<T> {
  return typeof value === "object" && value !== null && "keyframes" in value;
}

export type EvaluateAnimatable = <T>(
  value: Animatable<T>,
  frame: number,
  lerp: Lerp<T>
) => T;

export const evaluateAnimatable: EvaluateAnimatable = (value, frame, lerp) => {
  if (!isTrack(value)) return value;

  const { keyframes } = value;
  if (keyframes.length === 0) {
    throw new Error("A track needs at least one keyframe");
  }

  const first = keyframes[0];
  const last = keyframes[keyframes.length - 1];
  if (frame <= first.frame) return first.value;
  if (frame >= last.frame) return last.value;

  const next = keyframes.findIndex((keyframe) => keyframe.frame > frame);
  const from = keyframes[next - 1];
  const to = keyframes[next];
  const t = (frame - from.frame) / (to.frame - from.frame);
  return lerp(from.value, to.value, getEasing(from.easing ?? "linear")(t));
};
