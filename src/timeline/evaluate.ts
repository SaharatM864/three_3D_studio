import { notImplemented } from "@/lib/not-implemented";
import type { ClipSpec, SceneSpec } from "@/model/types";

import type { EvaluatedScene, EvaluatedSceneContent } from "./types";

/**
 * The single source of truth for "what the clip looks like at frame N".
 * Preview, seek and export must all call this; it must be a pure function of
 * (clip, frame) with no wall-clock time, delta accumulation or Math.random.
 */
export type EvaluateClip = (clip: ClipSpec, frame: number) => EvaluatedScene;

/** Lights and objects at frame N; shared by evaluateClip and the playground. */
export type EvaluateScene = (
  scene: SceneSpec,
  frame: number
) => EvaluatedSceneContent;

// TODO(M1): resolve light and object transforms/materials via evaluateAnimatable.
export const evaluateScene: EvaluateScene = () =>
  notImplemented("timeline/evaluateScene");

// TODO(M1): evaluateScene(clip, frame) plus the camera and frame/time.
export const evaluateClip: EvaluateClip = () =>
  notImplemented("timeline/evaluateClip");
