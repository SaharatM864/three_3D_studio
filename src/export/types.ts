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

export type AacEncoderSource = "native" | "wasm-fallback";

export type CapabilityReport =
  | { status: "ok"; audio: AacEncoderSource | "no-audio" }
  /** H.264 works but no AAC even with the WASM fallback; never drop audio silently. */
  | { status: "aac-unavailable" }
  | { status: "video-config-unsupported" }
  | { status: "no-h264" };

export type ExportPhase = "preparing" | "rendering" | "finalizing";

export interface ExportProgress {
  phase: ExportPhase;
  frame: number;
  totalFrames: number;
}

export type ExportResult =
  | { status: "done"; destination: "file-stream" }
  | { status: "done"; destination: "memory"; blob: Blob }
  | { status: "cancelled" }
  | { status: "failed"; error: unknown };
