/**
 * Encoding settings. Resolution and fps come from the project's VideoSettings.
 * These are starting points to test, not library defaults.
 */
export interface ExportPreset {
  label: string;
  video: {
    codec: "avc";
    /** Bits per second. */
    bitrate: number;
    keyFrameIntervalSeconds: number;
  };
  audio: {
    codec: "aac";
    sampleRate: number;
    numberOfChannels: number;
    /** Bits per second. */
    bitrate: number;
  };
}

/** Where the AAC encoder comes from. */
export type AacEncoderSource = "native" | "wasm-fallback";

/** Result of the runtime preflight check, one case per row of the browser-support table. */
export type CapabilityReport =
  | { status: "ok"; audio: AacEncoderSource | "no-audio" }
  /** H.264 works but no AAC even with the WASM fallback; never drop audio silently. */
  | { status: "aac-unavailable" }
  /** H.264 exists but not at this size/fps/bitrate; offer a lighter preset. */
  | { status: "video-config-unsupported" }
  | { status: "no-h264" };

export type ExportPhase = "preparing" | "rendering" | "finalizing";

export interface ExportProgress {
  phase: ExportPhase;
  /** Frames handed to the encoder so far. */
  frame: number;
  totalFrames: number;
}

export type ExportResult =
  | { status: "done"; destination: "file-stream" }
  | { status: "done"; destination: "memory"; blob: Blob }
  | { status: "cancelled" }
  | { status: "failed"; error: unknown };
