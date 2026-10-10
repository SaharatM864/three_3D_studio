import { useEffect } from "react";
import { InspectorBase } from "three/webgpu";

import { installConsoleFilter } from "./three-console";
import { useWebGPURenderer } from "./use-renderer";

export const INSPECTOR_QUERY_FLAG = "inspector";

export function RendererInspector() {
  const renderer = useWebGPURenderer();

  useEffect(() => {
    let active = true;
    let domElement: HTMLElement | null = null;

    void import("three/addons/inspector/Inspector.js").then(({ Inspector }) => {
      if (!active) return;
      const inspector = new Inspector();
      renderer.inspector = inspector;
      if (renderer.initialized) inspector.init();
      installConsoleFilter();
      domElement = inspector.domElement;
    });

    return () => {
      active = false;
      if (domElement === null) return;
      domElement.remove();
      renderer.inspector = new InspectorBase();
    };
  }, [renderer]);

  return null;
}
