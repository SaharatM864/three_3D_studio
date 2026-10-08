import { createContext, useContext } from "react";

import {
  DEFAULT_RENDER_QUALITY,
  RENDER_QUALITIES,
  type RenderQuality,
} from "../render-config";

export const RenderQualityContext = createContext<RenderQuality>(
  RENDER_QUALITIES[DEFAULT_RENDER_QUALITY]
);

export function useRenderQuality(): RenderQuality {
  return useContext(RenderQualityContext);
}
