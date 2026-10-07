import { notImplemented } from "@/lib/not-implemented";
import type { ColorValue, Vec3 } from "@/project/types";

export type Lerp<T> = (from: T, to: T, t: number) => T;

// TODO(M1)
export const lerpNumber: Lerp<number> = () =>
  notImplemented("timeline/lerpNumber");

// TODO(M1)
export const lerpVec3: Lerp<Vec3> = () => notImplemented("timeline/lerpVec3");

// TODO(M1): parse hex colors and interpolate per channel without three.js.
export const lerpColor: Lerp<ColorValue> = () =>
  notImplemented("timeline/lerpColor");
