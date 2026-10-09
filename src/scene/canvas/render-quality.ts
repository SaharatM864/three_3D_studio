import { createContext, useContext } from "react";

import { DEFAULT_QUALITY_PROFILE, type RenderQuality } from "../render-config";

export const RenderQualityContext = createContext<RenderQuality>(
  DEFAULT_QUALITY_PROFILE
);

export function useRenderQuality(): RenderQuality {
  return useContext(RenderQualityContext);
}
