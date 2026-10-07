import { create } from "zustand";

import type { EnvironmentPresetId } from "@/presets/environments";
import type { LightingPresetId } from "@/presets/lighting";

interface PlaygroundState {
  lightingPresetId: LightingPresetId;
  environmentPresetId: EnvironmentPresetId;
  isPointerLocked: boolean;
  setLightingPreset: (id: LightingPresetId) => void;
  setEnvironmentPreset: (id: EnvironmentPresetId) => void;
  setPointerLocked: (locked: boolean) => void;
}

export const usePlaygroundStore = create<PlaygroundState>()((set) => ({
  lightingPresetId: "studio-3-point",
  environmentPresetId: "studio-gray",
  isPointerLocked: false,
  setLightingPreset: (lightingPresetId) => set({ lightingPresetId }),
  setEnvironmentPreset: (environmentPresetId) => set({ environmentPresetId }),
  setPointerLocked: (isPointerLocked) => set({ isPointerLocked }),
}));
