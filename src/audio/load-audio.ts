import { notImplemented } from "@/lib/not-implemented";
import type { AssetPath } from "@/model/types";

export type LoadAudio = (
  context: BaseAudioContext,
  path: AssetPath
) => Promise<AudioBuffer>;

// TODO(M3): fetch(assetUrl(path)) → arrayBuffer → context.decodeAudioData.
export const loadAudio: LoadAudio = () => notImplemented("audio/loadAudio");
