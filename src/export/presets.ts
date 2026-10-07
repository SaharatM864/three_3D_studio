import type { ExportPreset } from "./types";

const AAC_STEREO_48K = {
  codec: "aac",
  sampleRate: 48_000,
  numberOfChannels: 2,
  bitrate: 192_000,
} as const;

export const exportPresets = {
  standard: {
    label: "Standard (10 Mbps)",
    video: { codec: "avc", bitrate: 10_000_000, keyFrameIntervalSeconds: 2 },
    audio: AAC_STEREO_48K,
  },
  high: {
    label: "High (12 Mbps)",
    video: { codec: "avc", bitrate: 12_000_000, keyFrameIntervalSeconds: 2 },
    audio: AAC_STEREO_48K,
  },
  light: {
    label: "Light (6 Mbps)",
    video: { codec: "avc", bitrate: 6_000_000, keyFrameIntervalSeconds: 2 },
    audio: AAC_STEREO_48K,
  },
} satisfies Record<string, ExportPreset>;

export type ExportPresetId = keyof typeof exportPresets;

export const DEFAULT_EXPORT_PRESET: ExportPresetId = "standard";
