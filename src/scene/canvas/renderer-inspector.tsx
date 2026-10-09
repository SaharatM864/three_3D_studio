import { useEffect } from "react";
import { InspectorBase } from "three/webgpu";

import { installConsoleFilter } from "./three-console";
import { useWebGPURenderer } from "./use-renderer";

const INSPECTOR_QUERY_PARAM = "inspector";

export function readShowInspector(): boolean {
  return new URLSearchParams(window.location.search).has(INSPECTOR_QUERY_PARAM);
}

export function RendererInspector() {
  const renderer = useWebGPURenderer();

  useEffect(() => {
    let active = true;
    let domElement: HTMLElement | null = null;

    void import("three/addons/inspector/Inspector.js").then(({ Inspector }) => {
      if (!active) return;
      const inspector = new Inspector();
      renderer.inspector = inspector;
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
