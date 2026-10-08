import type { ProjectId } from "@/projects/manifest";
import { usePlaygroundStore } from "@/stores/playground-store";

import { PlaygroundToolbar } from "./playground-toolbar";
import { Crosshair } from "./pointer-lock-overlay";

// TODO(G1): show <PointerLockOverlay onStart/> while unlocked; onStart calls
// requestPointerLock() on the canvas and pointerlockchange feeds
// setPointerLocked().
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
      {sceneReady && isPointerLocked && <Crosshair />}
      <PlaygroundToolbar projectId={projectId} hidden={isPointerLocked} />
    </>
  );
}
