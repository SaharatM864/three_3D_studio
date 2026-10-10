import { Canvas, useThree } from "@react-three/fiber";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { hasQueryFlag } from "@/lib/query-flags";

import {
  CAMERA_DEFAULTS,
  DEFAULT_QUALITY_PROFILE,
  type RenderQuality,
} from "../render-config";
import { CanvasErrorBoundary } from "./canvas-error-boundary";
import { createRenderer } from "./create-renderer";
import { resolvePixelRatio, type CssSize } from "./pixel-ratio";
import {
  createRenderActivity,
  RenderActivityContext,
  type RenderActivity,
} from "./render-activity";
import { INSPECTOR_QUERY_FLAG, RendererInspector } from "./renderer-inspector";
import { RenderQualityContext } from "./render-quality";
import {
  createSceneLoadTracker,
  SceneLoadContext,
  type SceneLoadState,
  type SceneLoadTracker,
} from "./scene-load";
import { useWebGPUSupport } from "./webgpu-support";
import "./three-console";

const RESIZE_OPTIONS = { scroll: true, debounce: { scroll: 50, resize: 100 } };

export interface SceneCanvasProps {
  quality?: RenderQuality;
  maxPixels?: number;
  inspector?: boolean;
  className?: string;
  frameloop?: "always" | "demand" | "never";
  fallback?: ReactNode;
  onLoadChange?: (state: SceneLoadState) => void;
  children?: ReactNode;
}

export function SceneCanvas({
  quality = DEFAULT_QUALITY_PROFILE,
  maxPixels,
  inspector = false,
  className,
  frameloop = "always",
  fallback,
  onLoadChange,
  children,
}: SceneCanvasProps) {
  const support = useWebGPUSupport();
  const [inspectorFlag] = useState(readInspectorFlag);
  const [cssSize, setCssSize] = useState<CssSize>(readWindowSize);
  const activity = useMemo(() => createRenderActivity(), []);
  const load = useMemo(() => createSceneLoadTracker(), []);

  useEffect(() => {
    if (onLoadChange === undefined) return;
    return load.subscribe(onLoadChange);
  }, [load, onLoadChange]);

  useEffect(() => {
    if (support === "unsupported") load.markUnavailable();
  }, [load, support]);

  if (support === "checking") return null;
  if (support === "unsupported") return <>{fallback}</>;

  const showInspector = inspector || inspectorFlag;
  const dpr = resolvePixelRatio(
    quality,
    maxPixels ?? quality.maxPixels,
    cssSize,
    window.devicePixelRatio
  );

  return (
    <CanvasErrorBoundary fallback={fallback} onFallback={load.markUnavailable}>
      <Canvas
        className={className}
        gl={createRenderer}
        frameloop={frameloop}
        resize={RESIZE_OPTIONS}
        flat
        shadows="percentage"
        dpr={dpr}
        camera={CAMERA_DEFAULTS}
      >
        <RenderQualityContext value={quality}>
          <RenderActivityContext value={activity}>
            <SceneLoadContext value={load}>
              <CanvasState
                activity={activity}
                load={load}
                onResize={setCssSize}
              />
              {children}
              {showInspector && <RendererInspector />}
            </SceneLoadContext>
          </RenderActivityContext>
        </RenderQualityContext>
      </Canvas>
    </CanvasErrorBoundary>
  );
}

function readInspectorFlag(): boolean {
  return hasQueryFlag(INSPECTOR_QUERY_FLAG);
}

function readWindowSize(): CssSize {
  return { width: window.innerWidth, height: window.innerHeight };
}

function CanvasState({
  activity,
  load,
  onResize,
}: {
  activity: RenderActivity;
  load: SceneLoadTracker;
  onResize: (size: CssSize) => void;
}) {
  const invalidate = useThree((state) => state.invalidate);
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);

  useLayoutEffect(() => activity.bind(invalidate), [activity, invalidate]);

  useLayoutEffect(() => {
    load.start();
  }, [load]);

  useLayoutEffect(() => {
    if (width > 0 && height > 0) onResize({ width, height });
  }, [onResize, width, height]);

  return null;
}
