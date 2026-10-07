import { KeyboardControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect } from "react";

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
    <div className="relative h-dvh w-full bg-black">
      {state.status === "ready" ? (
        <KeyboardControls map={controlsMap}>
          <Canvas shadows>
            <PlaygroundScene
              scene={state.module.scene}
              playground={state.module.playground}
              components={state.module.components}
            />
          </Canvas>
        </KeyboardControls>
      ) : (
        <p className="p-4 pt-16 text-sm text-muted-foreground">
          {state.status === "loading"
            ? "กำลังโหลดฉาก…"
            : `โหลดฉากไม่สำเร็จ: ${String(state.error)}`}
        </p>
      )}
      <Hud projectId={projectId} />
      <EnvironmentPanel />
    </div>
  );
}
