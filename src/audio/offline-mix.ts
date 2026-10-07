import { notImplemented } from "@/lib/not-implemented";
import type { ClipSpec } from "@/model/types";

export interface AudioMixOptions {
  sampleRate: number;
  numberOfChannels: number;
}

/**
 * Render the clip's audio clips (start, trim, volume) into one buffer the
 * length of the video, using OfflineAudioContext. Resolves null when the
 * clip has no audio, so no audio track is created.
 */
export type RenderAudioMix = (
  clip: ClipSpec,
  options: AudioMixOptions
) => Promise<AudioBuffer | null>;

// TODO(M3)
export const renderAudioMix: RenderAudioMix = () =>
  notImplemented("audio/renderAudioMix");
