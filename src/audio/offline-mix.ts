import { notImplemented } from "@/lib/not-implemented";
import type { ClipProject } from "@/project/types";

export interface AudioMixOptions {
  sampleRate: number;
  numberOfChannels: number;
}

/**
 * Render the project's audio clips (start, trim, volume) into one buffer the
 * length of the video, using OfflineAudioContext. Resolves null when the
 * project has no audio, so no audio track is created.
 */
export type RenderAudioMix = (
  project: ClipProject,
  options: AudioMixOptions
) => Promise<AudioBuffer | null>;

// TODO(M3)
export const renderAudioMix: RenderAudioMix = () =>
  notImplemented("audio/renderAudioMix");
