import { KeyboardControls } from "@react-three/drei";
import { useEffect } from "react";

import { ErrorScreen, LoadingScreen } from "@/components/status-screen";
import { controlsMap } from "@/game/controls";
import { PlaygroundScene } from "@/game/playground-scene";
import type { PlaygroundModule } from "@/projects/define";
import { projectLoaders } from "@/projects/loaders";
import type { ProjectId } from "@/projects/manifest";
import { RENDER_BACKEND_LABELS } from "@/scene/backend/render-backend";
import { useSelectedRenderBackend } from "@/scene/backend/select-backend";
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

function PlaygroundCanvas({ module }: { module: PlaygroundModule }) {
  const backend = useSelectedRenderBackend(module.scene.environment);

  return (
    <KeyboardControls map={controlsMap}>
      <SceneCanvas
        backend={backend}
        fallback={
          <ErrorScreen
            title={`เบราว์เซอร์นี้ไม่รองรับ ${RENDER_BACKEND_LABELS[backend]}`}
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
      </SceneCanvas>
    </KeyboardControls>
  );
}
