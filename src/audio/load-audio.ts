import { notImplemented } from "@/lib/not-implemented";
import type { AssetPath } from "@/project/types";

/** Fetch a same-origin audio asset and decode it. Results should be cached per path. */
export type LoadAudio = (
  context: BaseAudioContext,
  path: AssetPath
) => Promise<AudioBuffer>;

// TODO(M3): fetch(assetUrl(path)) → arrayBuffer → context.decodeAudioData.
export const loadAudio: LoadAudio = () => notImplemented("audio/loadAudio");
