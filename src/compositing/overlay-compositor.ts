import { notImplemented } from "@/lib/not-implemented";

/**
 * Canvas 2D layer for subtitles, logos or 2D text drawn over the 3D frame.
 * DOM/CSS overlays never reach the MP4, so preview and export both show the
 * composited canvas, and export captures it after the final effect pass.
 */
export interface OverlayCompositor {
  readonly canvas: HTMLCanvasElement;
  compose(source: HTMLCanvasElement, frame: number): void;
  dispose(): void;
}

export type CreateOverlayCompositor = (
  width: number,
  height: number
) => OverlayCompositor;

// TODO(M4): only once a clip needs 2D overlays; wait for fonts (Thai) before frame 0.
export const createOverlayCompositor: CreateOverlayCompositor = () =>
  notImplemented("compositing/createOverlayCompositor");
