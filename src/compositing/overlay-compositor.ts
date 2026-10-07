import { notImplemented } from "@/lib/not-implemented";

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
