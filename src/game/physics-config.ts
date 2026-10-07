import type { Vector3Tuple } from "three";

/** Fixed step for <Physics timeStep>, so simulations replay identically. */
export const PHYSICS_TIME_STEP = 1 / 60;

export const GRAVITY: Vector3Tuple = [0, -9.81, 0];
