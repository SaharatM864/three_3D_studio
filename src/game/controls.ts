import type { KeyboardControlsEntry } from "@react-three/drei";

export type ControlName =
  "forward" | "backward" | "left" | "right" | "jump" | "run" | "interact";

export const controlsMap: KeyboardControlsEntry<ControlName>[] = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
  { name: "jump", keys: ["Space"] },
  { name: "run", keys: ["ShiftLeft", "ShiftRight"] },
  { name: "interact", keys: ["KeyE"] },
];
