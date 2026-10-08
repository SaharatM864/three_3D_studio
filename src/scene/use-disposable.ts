import { useEffect, useRef } from "react";

export interface Disposable {
  dispose(): void;
}

export function useDisposable(resource: Disposable): void {
  const active = useRef<Disposable | null>(null);

  useEffect(() => {
    active.current = resource;
    return () => {
      active.current = null;
      queueMicrotask(() => {
        if (active.current !== resource) resource.dispose();
      });
    };
  }, [resource]);
}
