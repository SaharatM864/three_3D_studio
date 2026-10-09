import { create } from "zustand";

import type { EnvironmentPresetId } from "@/presets/environments";
import type { LightingPresetId } from "@/presets/lighting";
import type { OceanOverride } from "@/presets/ocean";

interface PlaygroundState {
  lightingPresetId: LightingPresetId | null;
  environmentPresetId: EnvironmentPresetId | null;
  oceanOverride: OceanOverride | null;
  isPointerLocked: boolean;
  setLightingPreset: (id: LightingPresetId | null) => void;
  setEnvironmentPreset: (id: EnvironmentPresetId | null) => void;
  setOceanOverride: (override: OceanOverride | null) => void;
  setPointerLocked: (locked: boolean) => void;
  reset: () => void;
}

const initialState = {
  lightingPresetId: null,
  environmentPresetId: null,
  oceanOverride: null,
  isPointerLocked: false,
} satisfies Partial<PlaygroundState>;

export const usePlaygroundStore = create<PlaygroundState>()((set) => ({
  ...initialState,
  setLightingPreset: (lightingPresetId) => set({ lightingPresetId }),
  setEnvironmentPreset: (environmentPresetId) => set({ environmentPresetId }),
  setOceanOverride: (oceanOverride) => set({ oceanOverride }),
  setPointerLocked: (isPointerLocked) => set({ isPointerLocked }),
  reset: () => set(initialState),
}));
