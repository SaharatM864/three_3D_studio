import { KeyboardControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";

import { ErrorScreen, LoadingScreen } from "@/components/status-screen";
import { controlsMap } from "@/game/controls";
import { PlaygroundScene } from "@/game/playground-scene";
import { projectLoaders } from "@/projects/loaders";
import type { ProjectId } from "@/projects/manifest";
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
      {state.status === "ready" && (
        <KeyboardControls map={controlsMap}>
          <Canvas shadows>
            <PlaygroundScene
              scene={state.module.scene}
              playground={state.module.playground}
              components={state.module.components}
            />
          </Canvas>
        </KeyboardControls>
      )}
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
