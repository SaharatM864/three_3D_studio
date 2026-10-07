import { notImplemented } from "@/lib/not-implemented";
import type { ClipSpec } from "@/model/types";

import type { RenderBridge } from "./render-bridge";

/**
 * The one clock for a clip canvas. The canvas runs with frameloop="never";
 * this driver evaluates the clip, applies it through the render bridge and
 * calls R3F advance() itself.
 *
 * - preview: requestAnimationFrame picks the frame from elapsed time
 *   (skipping frames when slow) — rAF callback counts are never the clock.
 * - export: renderFrame(n) renders exactly frame n, synchronously, so the
 *   canvas can be captured right after.
 */
export interface FrameDriver {
  readonly frame: number;
  readonly isPlaying: boolean;
  play(): void;
  pause(): void;
  seek(frame: number): void;
  /** Evaluate, apply and render one frame synchronously (export path). */
  renderFrame(frame: number): void;
  /** Notified on frame changes; UI should throttle what it displays. */
  subscribe(listener: (frame: number) => void): () => void;
  dispose(): void;
}

export interface FrameDriverOptions {
  clip: ClipSpec;
  bridge: RenderBridge;
  /** R3F `advance` bound to the clip canvas. */
  advance: (timestampMs: number) => void;
}

export type CreateFrameDriver = (options: FrameDriverOptions) => FrameDriver;

// TODO(M1): renderFrame for export. TODO(M2): play/pause/seek for preview.
export const createFrameDriver: CreateFrameDriver = () =>
  notImplemented("scene/createFrameDriver");
