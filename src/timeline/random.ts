import { notImplemented } from "@/lib/not-implemented";

/** Deterministic replacement for Math.random(). */
export interface SeededRandom {
  /** Float in [0, 1). */
  next(): number;
  /** Float in [min, max). */
  range(min: number, max: number): number;
  /** Integer in [min, max]. */
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
}

export type CreateSeededRandom = (seed: number) => SeededRandom;

// TODO(M1): small PRNG such as mulberry32; same seed must give the same sequence.
export const createSeededRandom: CreateSeededRandom = () =>
  notImplemented("timeline/createSeededRandom");
