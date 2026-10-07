import type { ProjectId } from "@/projects/manifest";
import { usePlaygroundStore } from "@/stores/playground-store";

import { PlaygroundToolbar } from "./playground-toolbar";
import { Crosshair, PointerLockOverlay } from "./pointer-lock-overlay";

// TODO(G1): pass onStart that calls requestPointerLock() on the canvas and
// mirror pointerlockchange into setPointerLocked().
export function Hud({
  projectId,
  sceneReady,
}: {
  projectId: ProjectId;
  sceneReady: boolean;
}) {
  const isPointerLocked = usePlaygroundStore((s) => s.isPointerLocked);

  return (
    <>
      {sceneReady && (isPointerLocked ? <Crosshair /> : <PointerLockOverlay />)}
      <PlaygroundToolbar projectId={projectId} hidden={isPointerLocked} />
    </>
  );
}
