import type { VideoSettings } from "./types";

export const VIDEO_FORMATS = {
  "landscape-1080p30": { width: 1920, height: 1080, fps: 30 },
  "portrait-1080p30": { width: 1080, height: 1920, fps: 30 },
} as const satisfies Record<string, Omit<VideoSettings, "durationInFrames">>;

export type VideoFormatId = keyof typeof VIDEO_FORMATS;

/** 10 seconds of 1080p30, the first export milestone (M1). */
export const DEFAULT_VIDEO: VideoSettings = {
  ...VIDEO_FORMATS["landscape-1080p30"],
  durationInFrames: 300,
};

export const DEFAULT_SEED = 1;
