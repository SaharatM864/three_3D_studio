import { notImplemented } from "@/lib/not-implemented";
import type { ClipProject } from "@/project/types";

import type { EvaluatedScene } from "./types";

/**
 * The single source of truth for "what the scene looks like at frame N".
 * Preview, seek and export must all call this; it must be a pure function of
 * (project, frame) with no wall-clock time, delta accumulation or Math.random.
 */
export type EvaluateProject = (
  project: ClipProject,
  frame: number
) => EvaluatedScene;

// TODO(M1): resolve camera, lights and object transforms/materials via evaluateAnimatable.
export const evaluateProject: EvaluateProject = () =>
  notImplemented("timeline/evaluateProject");
