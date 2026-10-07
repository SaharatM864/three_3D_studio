/** Frames are integers; time is always derived as `frame / fps`. */
export type FrameToSeconds = (frame: number, fps: number) => number;

export type SecondsToFrame = (seconds: number, fps: number) => number;

export type ClampFrame = (frame: number, durationInFrames: number) => number;

export const frameToSeconds: FrameToSeconds = (frame, fps) => frame / fps;

export const secondsToFrame: SecondsToFrame = (seconds, fps) =>
  Math.round(seconds * fps);

export const clampFrame: ClampFrame = (frame, durationInFrames) =>
  Math.min(Math.max(Math.round(frame), 0), Math.max(durationInFrames - 1, 0));
