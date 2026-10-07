import { notImplemented } from "@/lib/not-implemented";

import type { AssetPath, AssetRef, ClipSpec, SceneSpec } from "./types";

/** Resolve an asset path to a same-origin URL under /assets. */
export type AssetUrl = (path: AssetPath) => string;

// TODO(M4): return `/assets/${path}`, rejecting absolute and cross-origin URLs.
export const assetUrl: AssetUrl = () => notImplemented("model/assetUrl");

/**
 * Every asset a scene or clip references (models, textures, HDRIs, fonts,
 * audio), so they can be loaded before the first exported frame or before
 * the playground starts.
 */
export type CollectAssets = (
  spec: SceneSpec & Partial<Pick<ClipSpec, "audio">>
) => AssetRef[];

// TODO(M4): walk environment, objects, materials and audio; dedupe by path.
export const collectAssets: CollectAssets = () =>
  notImplemented("model/collectAssets");
