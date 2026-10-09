import { KeyboardControls, Stats } from "@react-three/drei";
import { useEffect, useState } from "react";

import { ErrorScreen, LoadingScreen } from "@/components/status-screen";
import { controlsMap } from "@/game/controls";
import { PlaygroundScene } from "@/game/playground-scene";
import type { PlaygroundModule } from "@/projects/define";
import { projectLoaders } from "@/projects/loaders";
import type { ProjectId } from "@/projects/manifest";
import { SceneCanvas } from "@/scene/canvas/scene-canvas";
import { usePlaygroundStore } from "@/stores/playground-store";

import { useLazyModule } from "../use-lazy-module";
import { EnvironmentPanel } from "./components/environment-panel";
import { Hud } from "./components/hud";

export function PlaygroundApp({ projectId }: { projectId: ProjectId }) {
  const state = useLazyModule(projectLoaders[projectId].playground);
  const resetStore = usePlaygroundStore((s) => s.reset);

  useEffect(() => resetStore(), [resetStore]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      {state.status === "ready" && <PlaygroundCanvas module={state.module} />}
      {state.status === "loading" && (
        <LoadingScreen label="กำลังโหลดฉาก…" className="h-full" />
      )}
      {state.status === "error" && (
        <ErrorScreen
          title="โหลดฉากไม่สำเร็จ"
          error={state.error}
          onRetry={() => window.location.reload()}
          className="h-full"
        />
      )}
      <Hud projectId={projectId} sceneReady={state.status === "ready"} />
      {state.status === "ready" && (
        <EnvironmentPanel scene={state.module.scene} />
      )}
    </div>
  );
}

const STATS_QUERY_PARAM = "stats";

function readShowStats(): boolean {
  return new URLSearchParams(window.location.search).has(STATS_QUERY_PARAM);
}

function PlaygroundCanvas({ module }: { module: PlaygroundModule }) {
  const renderQuality = usePlaygroundStore((s) => s.renderQuality);
  const [showStats] = useState(readShowStats);

  return (
    <KeyboardControls map={controlsMap}>
      <SceneCanvas
        quality={renderQuality}
        frameloop="demand"
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
