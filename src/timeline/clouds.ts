import type { CloudTextureTransform, Vec2, Vec3 } from "@/model/types";
import type { ResolvedClouds } from "@/presets/clouds";

import type { EvaluatedCloudMotion } from "./types";

export function evaluateCloudMotion(
  clouds: ResolvedClouds,
  timeSeconds: number
): EvaluatedCloudMotion {
  return {
    localWeatherOffset: advanceVec2(clouds.localWeather, timeSeconds),
    shapeOffset: advanceVec3(clouds.shape, timeSeconds),
    shapeDetailOffset: advanceVec3(clouds.shapeDetail, timeSeconds),
  };
}

function advanceVec2(
  { offset, velocity }: CloudTextureTransform<Vec2>,
  timeSeconds: number
): Vec2 {
  return [
    offset[0] + velocity[0] * timeSeconds,
    offset[1] + velocity[1] * timeSeconds,
  ];
}

function advanceVec3(
  { offset, velocity }: CloudTextureTransform<Vec3>,
  timeSeconds: number
): Vec3 {
  return [
    offset[0] + velocity[0] * timeSeconds,
    offset[1] + velocity[1] * timeSeconds,
    offset[2] + velocity[2] * timeSeconds,
  ];
}
