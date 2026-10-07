import { notImplemented } from "@/lib/not-implemented";

import type { AssetPath, AssetRef, ClipSpec, SceneSpec } from "./types";

export type AssetUrl = (path: AssetPath) => string;

// TODO(M4): return `/assets/${path}`, rejecting absolute and cross-origin URLs.
export const assetUrl: AssetUrl = () => notImplemented("model/assetUrl");

export type CollectAssets = (
  spec: SceneSpec & Partial<Pick<ClipSpec, "audio">>
) => AssetRef[];

// TODO(M4): walk environment, objects, materials and audio; dedupe by path.
export const collectAssets: CollectAssets = () =>
  notImplemented("model/collectAssets");
