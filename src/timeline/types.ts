import type { ColorValue, Vec2, Vec3 } from "@/model/types";

export interface EvaluatedSceneContent {
  lights: readonly EvaluatedLight[];
  objects: readonly EvaluatedObject[];
}

export interface EvaluatedScene extends EvaluatedSceneContent {
  frame: number;
  timeSeconds: number;
  camera: EvaluatedCamera;
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
  animationTime?: number;
}

export interface EvaluatedCloudMotion {
  localWeatherOffset: Vec2;
  shapeOffset: Vec3;
  shapeDetailOffset: Vec3;
}

export interface OceanStepPolicy {
  stepSeconds: number;
  prerollSteps: number;
  prerollStride: number;
  maxCatchUpSteps: number;
}

export interface OceanStepPlan {
  reset: boolean;
  firstStep: number;
  lastStep: number;
}
