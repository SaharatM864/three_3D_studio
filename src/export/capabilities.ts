import { notImplemented } from "@/lib/not-implemented";
import type { VideoSettings } from "@/model/types";

import type { CapabilityReport, ExportPreset } from "./types";

export interface CapabilityCheckInput {
  video: VideoSettings;
  preset: ExportPreset;
  hasAudio: boolean;
}

export type CheckExportCapabilities = (
  input: CapabilityCheckInput
) => Promise<CapabilityReport>;

// TODO(M1): canEncodeVideo("avc", { width, height, bitrate }).
// TODO(M3): canEncodeAudio("aac", …); if false, ensureAacEncoder() and check again.
export const checkExportCapabilities: CheckExportCapabilities = () =>
  notImplemented("export/checkExportCapabilities");
