import { notImplemented } from "@/lib/not-implemented";
import type {
  Animatable,
  ClipSpec,
  LightSpec,
  MaterialSpec,
  SceneObjectSpec,
  SceneSpec,
  Vec3,
} from "@/model/types";
import { resolveMaterial } from "@/presets/materials";

import { lerpColor, lerpNumber, lerpVec3, type Lerp } from "./interpolate";
import { evaluateAnimatable } from "./track";
import type {
  EvaluatedLight,
  EvaluatedMaterial,
  EvaluatedObject,
  EvaluatedScene,
  EvaluatedSceneContent,
} from "./types";

/**
 * The single source of truth for "what the clip looks like at frame N".
 * Preview, seek and export must all call this; it must be a pure function of
 * (clip, frame) with no wall-clock time, delta accumulation or Math.random.
 */
export type EvaluateClip = (clip: ClipSpec, frame: number) => EvaluatedScene;

export type EvaluateScene = (
  scene: SceneSpec,
  frame: number
) => EvaluatedSceneContent;

const ORIGIN: Vec3 = [0, 0, 0];
const UNIT_SCALE: Vec3 = [1, 1, 1];
const WHITE = "#ffffff";

export const evaluateScene: EvaluateScene = (scene, frame) => ({
  lights: scene.lights.map((light) => evaluateLight(light, frame)),
  objects: scene.objects.map((object) => evaluateObject(object, frame)),
});

// TODO(M1): evaluateScene(clip, frame) plus the camera and frame/time.
export const evaluateClip: EvaluateClip = () =>
  notImplemented("timeline/evaluateClip");

function evaluateLight(light: LightSpec, frame: number): EvaluatedLight {
  return {
    id: light.id,
    color: evaluateOptional(light.color, frame, lerpColor) ?? WHITE,
    intensity: evaluateAnimatable(light.intensity, frame, lerpNumber),
    position:
      "position" in light
        ? evaluateAnimatable(light.position, frame, lerpVec3)
        : undefined,
    target:
      "target" in light
        ? evaluateOptional(light.target, frame, lerpVec3)
        : undefined,
  };
}

function evaluateObject(
  object: SceneObjectSpec,
  frame: number
): EvaluatedObject {
  const transform = object.transform ?? {};
  return {
    id: object.id,
    transform: {
      position: evaluateOptional(transform.position, frame, lerpVec3) ?? ORIGIN,
      rotation: evaluateOptional(transform.rotation, frame, lerpVec3) ?? ORIGIN,
      scale: evaluateOptional(transform.scale, frame, lerpVec3) ?? UNIT_SCALE,
    },
    material:
      object.kind === "primitive" || object.kind === "text"
        ? evaluateMaterial(resolveMaterial(object.material), frame)
        : undefined,
  };
}

function evaluateMaterial(
  material: Omit<MaterialSpec, "presetId">,
  frame: number
): EvaluatedMaterial {
  return {
    color: evaluateOptional(material.color, frame, lerpColor),
    metalness: evaluateOptional(material.metalness, frame, lerpNumber),
    roughness: evaluateOptional(material.roughness, frame, lerpNumber),
    emissiveIntensity: evaluateOptional(
      material.emissiveIntensity,
      frame,
      lerpNumber
    ),
    opacity: evaluateOptional(material.opacity, frame, lerpNumber),
  };
}

function evaluateOptional<T>(
  value: Animatable<T> | undefined,
  frame: number,
  lerp: Lerp<T>
): T | undefined {
  return value === undefined
    ? undefined
    : evaluateAnimatable(value, frame, lerp);
}
