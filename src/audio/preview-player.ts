import { notImplemented } from "@/lib/not-implemented";
import type { ClipSpec } from "@/model/types";

export interface AudioPreviewPlayer {
  start(fromFrame: number): void;
  stop(): void;
  dispose(): void;
}

export type CreateAudioPreviewPlayer = (clip: ClipSpec) => AudioPreviewPlayer;

// TODO(M3): restart scheduling on play/seek; AudioContext must be resumed from a user gesture.
export const createAudioPreviewPlayer: CreateAudioPreviewPlayer = () =>
  notImplemented("audio/createAudioPreviewPlayer");
