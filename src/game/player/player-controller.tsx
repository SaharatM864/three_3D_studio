import type { FC } from "react";

export interface PlayerControllerProps {
  spawn?: [number, number, number];
}

// TODO(G1): kinematic capsule on the "player" layer in PhysicsWorld moved by a
// character controller PhysicsSystem from useKeyboardControls<ControlName>(),
// first-person camera with pointer lock; Shift runs, Space jumps.
export const PlayerController: FC<PlayerControllerProps> = () => null;
