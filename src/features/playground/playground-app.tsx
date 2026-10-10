import { KeyboardControls, Stats } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";

import { ErrorScreen } from "@/components/status-screen";
import { controlsMap } from "@/game/controls";
import { PlaygroundScene } from "@/game/playground-scene";
import { hasQueryFlag } from "@/lib/query-flags";
import type { PlaygroundModule } from "@/projects/define";
import { projectLoaders } from "@/projects/loaders";
import type { ProjectId } from "@/projects/manifest";
import { SceneCanvas } from "@/scene/canvas/scene-canvas";
import {
  INITIAL_SCENE_LOAD,
  type SceneLoadState,
} from "@/scene/canvas/scene-load";
import { resolveRenderQuality } from "@/scene/render-config";
import { usePlaygroundSettingsStore } from "@/stores/playground-settings-store";
import { usePlaygroundStore } from "@/stores/playground-store";

import { SceneLoadingOverlay, sceneLoadingStep } from "../scene-loading";
import { useLazyModule } from "../use-lazy-module";
import { EnvironmentPanel } from "./components/environment-panel";
import { Hud } from "./components/hud";

export function PlaygroundApp({ projectId }: { projectId: ProjectId }) {
  const state = useLazyModule(projectLoaders[projectId].playground);
  const [sceneLoad, setSceneLoad] =
    useState<SceneLoadState>(INITIAL_SCENE_LOAD);
  const resetStore = usePlaygroundStore((s) => s.reset);

  useEffect(() => resetStore(), [resetStore]);

  const sceneReady = state.status === "ready" && sceneLoad.status === "ready";
  const loadingStep =
    state.status === "loading"
      ? "module"
      : state.status === "ready"
        ? sceneLoadingStep(sceneLoad)
        : null;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      {state.status === "ready" && (
        <PlaygroundCanvas module={state.module} onLoadChange={setSceneLoad} />
      )}
      {state.status === "error" && (
        <ErrorScreen
          title="โหลดฉากไม่สำเร็จ"
          error={state.error}
          onRetry={() => window.location.reload()}
          className="h-full"
        />
      )}
      <SceneLoadingOverlay step={loadingStep} />
      <Hud projectId={projectId} sceneReady={sceneReady} />
      {state.status === "ready" && sceneLoad.status === "ready" && (
        <EnvironmentPanel scene={state.module.scene} />
      )}
    </div>
  );
}

const STATS_QUERY_FLAG = "stats";

function readStatsFlag(): boolean {
  return hasQueryFlag(STATS_QUERY_FLAG);
}

function PlaygroundCanvas({
  module,
  onLoadChange,
}: {
  module: PlaygroundModule;
  onLoadChange: (state: SceneLoadState) => void;
}) {
  const qualitySettings = usePlaygroundSettingsStore((s) => s.quality);
  const debug = usePlaygroundSettingsStore((s) => s.debug);
  const [statsFlag] = useState(readStatsFlag);
  const quality = useMemo(
    () => resolveRenderQuality(qualitySettings),
    [qualitySettings]
  );
  const showStats = debug.showStats || statsFlag;

  return (
    <KeyboardControls map={controlsMap}>
      <SceneCanvas
        quality={quality}
        inspector={debug.showInspector}
        frameloop={debug.pauseWhenIdle ? "demand" : "always"}
        onLoadChange={onLoadChange}
        fallback={
          <ErrorScreen
            title="เบราว์เซอร์นี้ไม่รองรับ WebGPU"
            error="เปิดหน้านี้ด้วย Chrome หรือ Edge เวอร์ชันล่าสุดบน desktop"
            className="h-full"
          />
        }
      >
        <PlaygroundScene
          scene={module.scene}
          playground={module.playground}
          components={module.components}
        />
        {showStats && <Stats className="top-auto! bottom-3! left-3!" />}
      </SceneCanvas>
    </KeyboardControls>
  );
}
