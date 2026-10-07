import type { FC } from "react";

export interface PlayerControllerProps {
  /** Spawn position in world units. */
  spawn?: [number, number, number];
}

// TODO(G1): capsule RigidBody moved by useKeyboardControls<ControlName>(),
// first-person camera with pointer lock; Shift runs, Space jumps.
export const PlayerController: FC<PlayerControllerProps> = () => null;
