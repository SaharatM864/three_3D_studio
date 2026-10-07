import { create } from "zustand";

export type ExportStatus =
  "idle" | "checking" | "exporting" | "done" | "cancelled" | "error";

interface StudioState {
  isPlaying: boolean;
  /**
   * For UI display only, updated at a throttled rate. Rendering reads the
   * frame from the frame driver — never drive the scene from this store.
   */
  displayFrame: number;
  exportStatus: ExportStatus;
  setPlaying: (isPlaying: boolean) => void;
  setDisplayFrame: (frame: number) => void;
  setExportStatus: (status: ExportStatus) => void;
  /** Called when a project's studio mounts; the store is global. */
  reset: () => void;
}

const initialState = {
  isPlaying: false,
  displayFrame: 0,
  exportStatus: "idle",
} satisfies Partial<StudioState>;

export const useStudioStore = create<StudioState>()((set) => ({
  ...initialState,
  setPlaying: (isPlaying) => set({ isPlaying }),
  setDisplayFrame: (displayFrame) => set({ displayFrame }),
  setExportStatus: (exportStatus) => set({ exportStatus }),
  reset: () => set(initialState),
}));
