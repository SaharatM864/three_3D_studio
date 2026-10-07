import { Placeholder } from "@/components/placeholder";
import { Button } from "@/components/ui/button";
import { DEFAULT_EXPORT_PRESET, exportPresets } from "@/export/presets";
import type { ClipSpec } from "@/model/types";

// TODO(M1): on click — pickOutputTarget() first (user gesture), then
// checkExportCapabilities(), runExport() with progress and cancel.
export function ExportDialog({ clip }: { clip: ClipSpec }) {
  const { width, height, fps } = clip.video;

  return (
    <Placeholder title="Export MP4" milestone="M1">
      <p>
        {width}×{height} · {fps} fps · H.264 ·{" "}
        {exportPresets[DEFAULT_EXPORT_PRESET].label}
      </p>
      <Button disabled>Export</Button>
    </Placeholder>
  );
}
