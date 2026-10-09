import { create } from "zustand";

import {
  DEFAULT_PLAYGROUND_SETTINGS,
  type DebugSettings,
  type OrbitSettings,
  type PlaygroundSettings,
  type ViewSettings,
} from "@/game/settings";
import type { RenderQualitySettings } from "@/scene/render-config";

interface PlaygroundSettingsState extends PlaygroundSettings {
  setQuality: (patch: Partial<RenderQualitySettings>) => void;
  setView: (patch: Partial<ViewSettings>) => void;
  setOrbit: (patch: Partial<OrbitSettings>) => void;
  setDebug: (patch: Partial<DebugSettings>) => void;
  reset: () => void;
}

export const usePlaygroundSettingsStore = create<PlaygroundSettingsState>()(
  (set) => ({
    ...DEFAULT_PLAYGROUND_SETTINGS,
    setQuality: (patch) =>
      set((s) => ({ quality: { ...s.quality, ...patch } })),
    setView: (patch) => set((s) => ({ view: { ...s.view, ...patch } })),
    setOrbit: (patch) => set((s) => ({ orbit: { ...s.orbit, ...patch } })),
    setDebug: (patch) => set((s) => ({ debug: { ...s.debug, ...patch } })),
    reset: () => set(DEFAULT_PLAYGROUND_SETTINGS),
  })
);
