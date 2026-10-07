import { create } from "zustand";

import type { EnvironmentPresetId } from "@/presets/environments";
import type { LightingPresetId } from "@/presets/lighting";

interface PlaygroundState {
  lightingPresetId: LightingPresetId | null;
  environmentPresetId: EnvironmentPresetId | null;
  isPointerLocked: boolean;
  setLightingPreset: (id: LightingPresetId | null) => void;
  setEnvironmentPreset: (id: EnvironmentPresetId | null) => void;
  setPointerLocked: (locked: boolean) => void;
  reset: () => void;
}

const initialState = {
  lightingPresetId: null,
  environmentPresetId: null,
  isPointerLocked: false,
} satisfies Partial<PlaygroundState>;

export const usePlaygroundStore = create<PlaygroundState>()((set) => ({
  ...initialState,
  setLightingPreset: (lightingPresetId) => set({ lightingPresetId }),
  setEnvironmentPreset: (environmentPresetId) => set({ environmentPresetId }),
  setPointerLocked: (isPointerLocked) => set({ isPointerLocked }),
  reset: () => set(initialState),
}));
