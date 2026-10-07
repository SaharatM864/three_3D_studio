import { notImplemented } from "@/lib/not-implemented";
import type { ClipSpec } from "@/model/types";

export interface AudioMixOptions {
  sampleRate: number;
  numberOfChannels: number;
}

export type RenderAudioMix = (
  clip: ClipSpec,
  options: AudioMixOptions
) => Promise<AudioBuffer | null>;

// TODO(M3)
export const renderAudioMix: RenderAudioMix = () =>
  notImplemented("audio/renderAudioMix");
