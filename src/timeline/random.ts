import { notImplemented } from "@/lib/not-implemented";

export interface SeededRandom {
  next(): number;
  range(min: number, max: number): number;
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
}

export type CreateSeededRandom = (seed: number) => SeededRandom;

// TODO(M1): small PRNG such as mulberry32; same seed must give the same sequence.
export const createSeededRandom: CreateSeededRandom = () =>
  notImplemented("timeline/createSeededRandom");
