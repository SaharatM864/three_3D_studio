import { createContext, type RefObject } from "react";

import { notImplemented } from "@/lib/not-implemented";

export interface ClipTime {
  frame: number;
  timeSeconds: number;
  fps: number;
}

/**
 * Current clip time, owned by the frame driver. A ref (not React state) so
 * per-frame updates never wait for a React commit before capture. The
 * playground provides the same context with a real-time clock, so a scene's
 * custom components run in both modes.
 */
export const ClipClockContext = createContext<RefObject<ClipTime> | null>(null);

/**
 * For custom clip components: read `clock.current` inside useFrame() and
 * derive everything from it — never from useFrame's delta or wall-clock time.
 */
export type UseClipFrame = () => Readonly<RefObject<ClipTime>>;

// TODO(M2): useContext(ClipClockContext) and throw when rendered outside a
// clip or playground canvas.
export const useClipFrame: UseClipFrame = () =>
  notImplemented("scene/useClipFrame");
