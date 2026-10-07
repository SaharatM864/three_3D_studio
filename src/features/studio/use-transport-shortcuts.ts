import { useEffect } from "react";

import { useStudioController } from "./studio-controller";

const IGNORED_TARGETS =
  "input, textarea, select, [contenteditable='true'], [role='dialog']";

export function useTransportShortcuts(durationInFrames: number) {
  const controller = useStudioController();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (
        event.target instanceof Element &&
        event.target.closest(IGNORED_TARGETS)
      ) {
        return;
      }

      switch (event.code) {
        case "Space":
          controller.togglePlay();
          break;
        case "ArrowLeft":
          controller.step(event.shiftKey ? -10 : -1);
          break;
        case "ArrowRight":
          controller.step(event.shiftKey ? 10 : 1);
          break;
        case "Home":
          controller.seek(0);
          break;
        case "End":
          controller.seek(durationInFrames - 1);
          break;
        default:
          return;
      }
      event.preventDefault();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [controller, durationInFrames]);
}
