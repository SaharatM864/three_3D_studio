import {
  cameraPosition,
  dot,
  float,
  mix,
  normalize,
  refract,
  saturate,
  vec3,
} from "three/tsl";
import type { Node } from "three/webgpu";

import { N_WATER } from "./constants";
import { fresnelDielectric } from "./reflection";
import type { SkyLight } from "./sky-light";
import { expVec3, mixVec3 } from "./vector-math";
import type { WaterBody } from "./water-body";

export interface UnderwaterInputs {
  surface: Node<"vec3">;
  normal: Node<"vec3">;
  view: Node<"vec3">;
  viewDistance: Node<"float">;
  cameraWaterHeight: Node<"float">;
  body: WaterBody;
  light: SkyLight;
}

export function shadeUnderwater({
  surface,
  normal,
  view,
  viewDistance,
  cameraWaterHeight,
  body,
  light,
}: UnderwaterInputs): Node<"vec3"> {
  const deepBody = body.deepBody.mul(light.ambientLevel).toVar();
  const submerged = saturate(
    cameraWaterHeight.sub(cameraPosition.y).mul(3).add(0.5)
  ).toVar();
  const under = saturate(dot(normal, view).negate().mul(8))
    .mul(submerged)
    .toVar();
  const normalBelow = normal.negate().toVar();
  const cosUp = saturate(dot(normalBelow, view)).toVar();
  const fresnelUp = fresnelDielectric(cosUp, N_WATER).toVar();
  const refracted = refract(view.negate(), normalBelow, float(N_WATER)).toVar();
  const window = light.sky(normalize(refracted.add(vec3(0, 1e-5, 0)))).toVar();
  const underLit = mix(
    window,
    deepBody.mul(float(0.3).add(body.facing.mul(0.5))),
    fresnelUp
  ).toVar();
  const shaded = mix(surface, underLit, under).toVar();
  const extinction = expVec3(
    body.absorption.mul(viewDistance).negate()
  ).toVar();
  return mix(
    shaded,
    mixVec3(deepBody.mul(0.35), shaded, extinction),
    submerged
  );
}
