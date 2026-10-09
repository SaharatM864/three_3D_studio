import { create } from "zustand";

import type { EnvironmentPresetId } from "@/presets/environments";
import type { LightingPresetId } from "@/presets/lighting";
import type { OceanOverride, UnderwaterPresetId } from "@/presets/ocean";

interface PlaygroundState {
  lightingPresetId: LightingPresetId | null;
  environmentPresetId: EnvironmentPresetId | null;
  oceanOverride: OceanOverride | null;
  underwaterPresetId: UnderwaterPresetId | null;
  underwaterWhiteBalance: number | null;
  isPointerLocked: boolean;
  setLightingPreset: (id: LightingPresetId | null) => void;
  setEnvironmentPreset: (id: EnvironmentPresetId | null) => void;
  setOceanOverride: (override: OceanOverride | null) => void;
  setUnderwaterPreset: (id: UnderwaterPresetId | null) => void;
  setUnderwaterWhiteBalance: (whiteBalance: number | null) => void;
  setPointerLocked: (locked: boolean) => void;
  reset: () => void;
}

const initialState = {
  lightingPresetId: null,
  environmentPresetId: null,
  oceanOverride: null,
  underwaterPresetId: null,
  underwaterWhiteBalance: null,
  isPointerLocked: false,
} satisfies Partial<PlaygroundState>;

export const usePlaygroundStore = create<PlaygroundState>()((set) => ({
  ...initialState,
  setLightingPreset: (lightingPresetId) => set({ lightingPresetId }),
  setEnvironmentPreset: (environmentPresetId) => set({ environmentPresetId }),
  setOceanOverride: (oceanOverride) => set({ oceanOverride }),
  setUnderwaterPreset: (underwaterPresetId) => set({ underwaterPresetId }),
  setUnderwaterWhiteBalance: (underwaterWhiteBalance) =>
    set({ underwaterWhiteBalance }),
  setPointerLocked: (isPointerLocked) => set({ isPointerLocked }),
  reset: () => set(initialState),
}));
