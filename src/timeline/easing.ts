import { notImplemented } from "@/lib/not-implemented";
import type { EasingName } from "@/model/types";

export type EasingFn = (t: number) => number;

export type GetEasing = (name: EasingName) => EasingFn;

// TODO(M1): one pure function per EasingName.
export const getEasing: GetEasing = () => notImplemented("timeline/getEasing");
