import { getConsoleFunction, setConsoleFunction } from "three";

type ConsoleFunction = Parameters<typeof setConsoleFunction>[0];

interface StackTrace {
  isStackTrace: true;
  getError(message: string): Error;
}

// R3F 9 creates a THREE.Clock in every store; drop this filter once R3F uses THREE.Timer.
const R3F_CLOCK_DEPRECATION =
  "THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.";

function isStackTrace(value: unknown): value is StackTrace {
  return (
    typeof value === "object" &&
    value !== null &&
    "isStackTrace" in value &&
    value.isStackTrace === true
  );
}

export function installConsoleFilter(): void {
  const forward = getConsoleFunction() as ConsoleFunction | null;

  setConsoleFunction((type, message, ...params) => {
    if (type === "warn" && message === R3F_CLOCK_DEPRECATION) return;
    if (forward) {
      forward(type, message, ...params);
      return;
    }
    const [trace] = params;
    if (type !== "log" && isStackTrace(trace)) {
      console[type](trace.getError(message));
    } else {
      console[type](message, ...params);
    }
  });
}

installConsoleFilter();
