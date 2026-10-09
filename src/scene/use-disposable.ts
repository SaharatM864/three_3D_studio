import { useEffect, useRef } from "react";

export interface Disposable {
  dispose(): void;
}

export function useDisposable(resource: Disposable | null): void {
  const active = useRef<Disposable | null>(null);

  useEffect(() => {
    if (resource === null) return;
    active.current = resource;
    return () => {
      active.current = null;
      queueMicrotask(() => {
        if (active.current !== resource) resource.dispose();
      });
    };
  }, [resource]);
}
