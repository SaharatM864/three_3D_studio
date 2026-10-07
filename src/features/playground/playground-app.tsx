import { KeyboardControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import { controlsMap } from "@/game/controls";
import { PlaygroundScene } from "@/game/playground-scene";

import { EnvironmentPanel } from "./components/environment-panel";
import { Hud } from "./components/hud";

export function PlaygroundApp() {
  return (
    <div className="relative h-dvh w-full bg-black">
      <KeyboardControls map={controlsMap}>
        <Canvas shadows>
          <PlaygroundScene />
        </Canvas>
      </KeyboardControls>
      <Hud />
      <EnvironmentPanel />
    </div>
  );
}
