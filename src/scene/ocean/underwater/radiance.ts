import { dot, exp2, float, max, normalize, refract, vec3 } from "three/tsl";
import type { Node } from "three/webgpu";

import { N_WATER } from "../surface/constants";
import type { SkyLight } from "../surface/sky-light";
import { expVec3 } from "../surface/vector-math";
import {
  BACKSCATTER_LEVEL,
  ELEVATION_STOPS,
  SUN_LOBE_G,
  SUN_LOBE_GAIN,
} from "./constants";

const UP = vec3(0, 1, 0);

export interface WaterLightingInputs {
  light: SkyLight;
  albedo: Node<"vec3">;
  downwelling: Node<"vec3">;
  cameraDepth: Node<"float">;
}

export interface WaterLighting {
  readonly sunInWater: Node<"vec3">;
  readonly depthTransmittance: Node<"vec3">;
  radiance(direction: Node<"vec3">): Node<"vec3">;
}

export function refractedSunTravel(sunDirection: Node<"vec3">): Node<"vec3"> {
  const above = normalize(
    vec3(sunDirection.x, max(sunDirection.y, float(0.01)), sunDirection.z)
  );
  return normalize(refract(above.negate(), UP, float(1 / N_WATER)));
}

function henyeyGreenstein(cosTheta: Node<"float">, g: number): Node<"float"> {
  const denominator = float(1 + g * g)
    .sub(cosTheta.mul(2 * g))
    .max(1e-4)
    .toVar();
  return float((1 - g * g) / (4 * Math.PI)).div(
    denominator.mul(denominator.sqrt())
  );
}

export function createWaterLighting({
  light,
  albedo,
  downwelling,
  cameraDepth,
}: WaterLightingInputs): WaterLighting {
  const sunInWater = refractedSunTravel(light.sunDirection).negate().toVar();
  const depthTransmittance = expVec3(
    downwelling.mul(cameraDepth).negate()
  ).toVar();
  const irradiance = light.sunColor
    .mul(max(light.sunDirection.y, float(0)))
    .add(light.ambient);
  const ambient = albedo.mul(irradiance).mul(BACKSCATTER_LEVEL).toVar();
  const sun = albedo.mul(light.sunColor).mul(SUN_LOBE_GAIN).toVar();

  return {
    sunInWater,
    depthTransmittance,
    radiance(direction) {
      const elevation = exp2(direction.y.mul(ELEVATION_STOPS));
      const phase = henyeyGreenstein(dot(direction, sunInWater), SUN_LOBE_G);
      return ambient.mul(elevation).add(sun.mul(phase)).mul(depthTransmittance);
    },
  };
}
