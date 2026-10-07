import { create } from "zustand";

import { DEFAULT_EXPORT_PRESET, type ExportPresetId } from "@/export/presets";
import type {
  CapabilityReport,
  ExportProgress,
  ExportResult,
} from "@/export/types";

export type StudioSelection =
  | { kind: "environment" }
  | { kind: "camera" }
  | { kind: "light"; id: string }
  | { kind: "object"; id: string }
  | { kind: "audio"; id: string };

export type ExportUiState =
  | { status: "idle" }
  | { status: "checking" }
  | {
      status: "unsupported";
      report: Exclude<CapabilityReport, { status: "ok" }>;
    }
  | { status: "exporting"; progress: ExportProgress }
  | { status: "done"; result: Extract<ExportResult, { status: "done" }> }
  | { status: "cancelled" }
  | { status: "failed"; error: unknown };

export function selectionKey(selection: StudioSelection): string {
  return "id" in selection ? `${selection.kind}:${selection.id}` : selection.kind;
}

interface StudioState {
  isPlaying: boolean;
  isLooping: boolean;
  /**
   * For UI display only, updated at a throttled rate. Rendering reads the
   * frame from the frame driver — never drive the scene from this store.
   */
  displayFrame: number;
  selection: StudioSelection | null;
  exportPresetId: ExportPresetId;
  exportState: ExportUiState;
  setPlaying: (isPlaying: boolean) => void;
  setLooping: (isLooping: boolean) => void;
  setDisplayFrame: (frame: number) => void;
  setSelection: (selection: StudioSelection | null) => void;
  setExportPreset: (id: ExportPresetId) => void;
  setExportState: (state: ExportUiState) => void;
  reset: () => void;
}

const initialState = {
  isPlaying: false,
  isLooping: false,
  displayFrame: 0,
  selection: null,
  exportPresetId: DEFAULT_EXPORT_PRESET,
  exportState: { status: "idle" },
} satisfies Partial<StudioState>;

export const useStudioStore = create<StudioState>()((set) => ({
  ...initialState,
  setPlaying: (isPlaying) => set({ isPlaying }),
  setLooping: (isLooping) => set({ isLooping }),
  setDisplayFrame: (displayFrame) => set({ displayFrame }),
  setSelection: (selection) => set({ selection }),
  setExportPreset: (exportPresetId) => set({ exportPresetId }),
  setExportState: (exportState) => set({ exportState }),
  reset: () => set(initialState),
}));
