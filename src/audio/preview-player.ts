import { notImplemented } from "@/lib/not-implemented";
import type { ClipProject } from "@/project/types";

/** Live AudioContext playback that follows the frame driver during preview. */
export interface AudioPreviewPlayer {
  /** Schedule every audio clip relative to `fromFrame`. */
  start(fromFrame: number): void;
  stop(): void;
  dispose(): void;
}

export type CreateAudioPreviewPlayer = (
  project: ClipProject
) => AudioPreviewPlayer;

// TODO(M3): restart scheduling on play/seek; AudioContext must be resumed from a user gesture.
export const createAudioPreviewPlayer: CreateAudioPreviewPlayer = () =>
  notImplemented("audio/createAudioPreviewPlayer");
