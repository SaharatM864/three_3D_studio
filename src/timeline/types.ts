import type { ColorValue, Vec3 } from "@/project/types";

/**
 * Animated values resolved at one frame. Static structure (object kinds,
 * shapes, asset paths) stays in ClipProject; renderers match entries by `id`.
 */
export interface EvaluatedScene {
  frame: number;
  timeSeconds: number;
  camera: EvaluatedCamera;
  lights: readonly EvaluatedLight[];
  objects: readonly EvaluatedObject[];
}

export interface EvaluatedCamera {
  position: Vec3;
  target: Vec3;
  fov: number;
}

export interface EvaluatedLight {
  id: string;
  color: ColorValue;
  intensity: number;
  position?: Vec3;
  target?: Vec3;
}

export interface EvaluatedTransform {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
}

export interface EvaluatedMaterial {
  color?: ColorValue;
  metalness?: number;
  roughness?: number;
  emissiveIntensity?: number;
  opacity?: number;
}

export interface EvaluatedObject {
  id: string;
  transform: EvaluatedTransform;
  material?: EvaluatedMaterial;
  /** Seconds into the GLB animation, for AnimationMixer.setTime(). */
  animationTime?: number;
}
