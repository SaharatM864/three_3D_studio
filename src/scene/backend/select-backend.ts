import { useMemo, useState } from "react";

import type { EnvironmentSpec } from "@/model/types";
import { resolveEnvironment } from "@/presets/environments";

import { RENDER_BACKEND } from "../render-config";
import type { RenderBackendId } from "./render-backend";

interface RenderBackendFeatures {
  clouds: boolean;
}

// TODO(M6): set webgpu.clouds to true once createScenePipeline renders clouds, then delete src/scene/webgl/.
export const RENDER_BACKEND_FEATURES: Record<
  RenderBackendId,
  RenderBackendFeatures
> = {
  webgpu: { clouds: false },
  webgl: { clouds: true },
};

const BACKEND_PRIORITY: readonly RenderBackendId[] = ["webgpu", "webgl"];

const RENDERER_QUERY_PARAM = "renderer";

const warned = new Set<RenderBackendId>();

export function isRenderBackendId(value: string): value is RenderBackendId {
  return Object.hasOwn(RENDER_BACKEND_FEATURES, value);
}

export function selectRenderBackend(
  environment: EnvironmentSpec,
  override: RenderBackendId | null = null
): RenderBackendId {
  const needsClouds = resolveEnvironment(environment).clouds !== null;
  const supports = (id: RenderBackendId) =>
    !needsClouds || RENDER_BACKEND_FEATURES[id].clouds;

  const forced =
    override ?? (RENDER_BACKEND === "auto" ? null : RENDER_BACKEND);
  if (forced === null) {
    return BACKEND_PRIORITY.find(supports) ?? BACKEND_PRIORITY[0];
  }

  if (!supports(forced) && !warned.has(forced)) {
    warned.add(forced);
    console.warn(
      `[render] the ${forced} backend cannot render clouds yet; rendering without them`
    );
  }
  return forced;
}

export function readRenderBackendOverride(): RenderBackendId | null {
  const value = new URLSearchParams(window.location.search).get(
    RENDERER_QUERY_PARAM
  );
  return value !== null && isRenderBackendId(value) ? value : null;
}

export function useSelectedRenderBackend(
  environment: EnvironmentSpec
): RenderBackendId {
  const [override] = useState(readRenderBackendOverride);
  return useMemo(
    () => selectRenderBackend(environment, override),
    [environment, override]
  );
}
