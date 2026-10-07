import { notImplemented } from "@/lib/not-implemented";
import type { ClipSpec } from "@/model/types";
import type { FrameDriver } from "@/scene/frame-driver";

import type { OutputTargetChoice } from "./targets";
import type { ExportPreset, ExportProgress, ExportResult } from "./types";

export interface RunExportOptions {
  /** Snapshot taken when export starts; edits during export must not leak in. */
  clip: ClipSpec;
  preset: ExportPreset;
  canvas: HTMLCanvasElement;
  driver: FrameDriver;
  target: OutputTargetChoice;
  signal: AbortSignal;
  onProgress?: (progress: ExportProgress) => void;
}

/**
 * 1. wait for assets, fonts and shaders
 * 2. prepare the audio mix and the video/audio tracks
 * 3. start the output
 * 4. for frame 0 … durationInFrames - 1: driver.renderFrame(frame), composite
 *    overlays, add to CanvasSource with timestamp = frame / fps and
 *    duration = 1 / fps (seconds), await backpressure, check `signal`
 * 5. finalize, then always restore preview and release resources
 */
export type RunExport = (options: RunExportOptions) => Promise<ExportResult>;

// TODO(M1): video-only MP4. TODO(M3): audio track. TODO(M5): cancel and cleanup paths.
export const runExport: RunExport = () => notImplemented("export/runExport");
