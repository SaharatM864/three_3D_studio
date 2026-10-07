import { createContext, useContext, useMemo, type ReactNode } from "react";

import { notImplemented } from "@/lib/not-implemented";
import type { VideoSettings } from "@/model/types";
import { useStudioStore } from "@/stores/studio-store";
import { clampFrame } from "@/timeline/time";

export interface StudioController {
  exportAvailable: boolean;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (frame: number) => void;
  step: (delta: number) => void;
  startExport: () => void;
  cancelExport: () => void;
  resetExport: () => void;
}

const StudioControllerContext = createContext<StudioController | null>(null);

export function StudioControllerProvider({
  video,
  children,
}: {
  video: VideoSettings;
  children: ReactNode;
}) {
  const { durationInFrames } = video;

  const controller = useMemo<StudioController>(() => {
    const store = useStudioStore.getState;

    // TODO(M2): delegate play/pause/seek to the FrameDriver and mirror its
    // frame into setDisplayFrame (throttled) through driver.subscribe().
    const seek = (frame: number) =>
      store().setDisplayFrame(clampFrame(frame, durationInFrames));

    return {
      exportAvailable: false,
      play: () => store().setPlaying(true),
      pause: () => store().setPlaying(false),
      togglePlay: () => store().setPlaying(!store().isPlaying),
      seek,
      step: (delta) => seek(store().displayFrame + delta),
      // TODO(M1): pickOutputTarget() first (user gesture), then
      // checkExportCapabilities() and runExport(), writing setExportState().
      startExport: () => notImplemented("studio/startExport"),
      // TODO(M5): abort the running export through its AbortController.
      cancelExport: () => notImplemented("studio/cancelExport"),
      resetExport: () => store().setExportState({ status: "idle" }),
    };
  }, [durationInFrames]);

  return (
    <StudioControllerContext value={controller}>
      {children}
    </StudioControllerContext>
  );
}

export function useStudioController(): StudioController {
  const controller = useContext(StudioControllerContext);
  if (!controller) {
    throw new Error("useStudioController needs a StudioControllerProvider");
  }
  return controller;
}
