import { notImplemented } from "@/lib/not-implemented";

/** Frames are integers; time is always derived as `frame / fps`. */
export type FrameToSeconds = (frame: number, fps: number) => number;

/** Nearest whole frame for a time in seconds. */
export type SecondsToFrame = (seconds: number, fps: number) => number;

/** Clamp to `[0, durationInFrames - 1]`. */
export type ClampFrame = (frame: number, durationInFrames: number) => number;

// TODO(M1): frame / fps
export const frameToSeconds: FrameToSeconds = () =>
  notImplemented("timeline/frameToSeconds");

// TODO(M1): Math.round(seconds * fps)
export const secondsToFrame: SecondsToFrame = () =>
  notImplemented("timeline/secondsToFrame");

// TODO(M1)
export const clampFrame: ClampFrame = () =>
  notImplemented("timeline/clampFrame");
