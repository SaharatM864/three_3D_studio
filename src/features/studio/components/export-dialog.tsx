import { Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ClipSpec } from "@/model/types";
import { useStudioStore } from "@/stores/studio-store";

import { useStudioController } from "../studio-controller";
import { detectExportDestination, ExportStateView } from "./export-views";

export function ExportDialog({ clip }: { clip: ClipSpec }) {
  const controller = useStudioController();
  const exportState = useStudioStore((s) => s.exportState);
  const presetId = useStudioStore((s) => s.exportPresetId);
  const setExportPreset = useStudioStore((s) => s.setExportPreset);
  const [open, setOpen] = useState(false);
  const [destination] = useState(detectExportDestination);
  const busy =
    exportState.status === "checking" || exportState.status === "exporting";

  function close() {
    setOpen(false);
    if (exportState.status !== "idle") controller.resetExport();
  }

  return (
    <Dialog
      open={open}
      disablePointerDismissal={busy}
      onOpenChange={(next) => {
        if (next) setOpen(true);
        else if (!busy) close();
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <Download />
        Export
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg" showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>Export MP4</DialogTitle>
          <DialogDescription>
            H.264 + AAC · render และ encode บนเครื่องนี้ทั้งหมด
          </DialogDescription>
        </DialogHeader>
        <ExportStateView
          state={exportState}
          video={clip.video}
          hasAudio={clip.audio.length > 0}
          fileName={`${clip.id}.mp4`}
          presetId={presetId}
          destination={destination}
          exportAvailable={controller.exportAvailable}
          onPresetChange={setExportPreset}
          onStart={controller.startExport}
          onCancel={controller.cancelExport}
          onReset={controller.resetExport}
          onClose={close}
        />
      </DialogContent>
    </Dialog>
  );
}
