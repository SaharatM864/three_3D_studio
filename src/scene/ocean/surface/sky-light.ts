import {
  clamp,
  dot,
  float,
  max,
  mix,
  normalize,
  smoothstep,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import type { Node, NodeBuilder } from "three/webgpu";

import {
  getAtmosphereContext,
  getIndirectLuminance,
  getSplitIlluminance,
} from "../../atmosphere/takram";
import { LUMA } from "./constants";

const HORIZON_FOLD = 0.03;
const SUN_CALIBRATION = 0.8;
const SUN_REFERENCE = 1.4;
const AMBIENT_REFERENCE = 0.242;
const LEVEL_MAX = 2;
const SPECULAR_BOOST = 12;
const SPECULAR_ELEVATION: readonly [number, number] = [0.2, 0.78];

export interface SkyLight {
  sky(direction: Node<"vec3">): Node<"vec3">;
  readonly sunDirection: Node<"vec3">;
  readonly sunColor: Node<"vec3">;
  readonly ambient: Node<"vec3">;
  readonly ambientLevel: Node<"float">;
  readonly sunLevel: Node<"float">;
  readonly specularBoost: Node<"float">;
  readonly outputScale: Node<"float">;
}

export function luminance(color: Node<"vec3">): Node<"float"> {
  return dot(color, vec3(...LUMA));
}

export function createSkyLight(
  builder: NodeBuilder,
  luminanceGain: Node<"float">
): SkyLight {
  const atmosphere = getAtmosphereContext(builder);
  const cameraUnit = atmosphere.cameraPositionUnit
    .add(atmosphere.altitudeCorrectionUnit)
    .toVar();
  const sunDirectionECEF = atmosphere.sunDirectionECEF;
  const toECEF = (direction: Node<"vec3">) =>
    normalize(atmosphere.matrixWorldToECEF.mul(vec4(direction, 0)).xyz);

  const sunDirection = normalize(
    atmosphere.matrixECEFToWorld.mul(vec4(sunDirectionECEF, 0)).xyz
  ).toVar();
  const sunIlluminance = getSplitIlluminance(
    cameraUnit,
    sunDirectionECEF,
    sunDirectionECEF
  ).get("direct");
  const skyIlluminance = getSplitIlluminance(
    cameraUnit,
    toECEF(vec3(0, 1, 0)),
    sunDirectionECEF
  ).get("indirect");

  const sunColor = sunIlluminance
    .mul(luminanceGain)
    .mul(SUN_CALIBRATION / Math.PI)
    .toVar();
  const ambient = skyIlluminance
    .mul(luminanceGain)
    .mul(1 / Math.PI)
    .toVar();

  return {
    sky(direction) {
      const d = normalize(direction).toVar();
      const y = mix(
        float(HORIZON_FOLD),
        d.y.max(0),
        smoothstep(-HORIZON_FOLD, HORIZON_FOLD, d.y)
      );
      return getIndirectLuminance(
        cameraUnit,
        toECEF(normalize(vec3(d.x, y, d.z))),
        vec2(0),
        sunDirectionECEF
      )
        .get("luminance")
        .mul(luminanceGain);
    },
    sunDirection,
    sunColor,
    ambient,
    ambientLevel: clamp(
      luminance(ambient).div(AMBIENT_REFERENCE),
      0,
      LEVEL_MAX
    ).toVar(),
    sunLevel: clamp(
      luminance(sunColor).div(SUN_REFERENCE),
      0,
      LEVEL_MAX
    ).toVar(),
    specularBoost: smoothstep(
      SPECULAR_ELEVATION[0],
      SPECULAR_ELEVATION[1],
      sunDirection.y
    )
      .mul(SPECULAR_BOOST)
      .toVar(),
    outputScale: float(1).div(max(luminanceGain, 1e-6)),
  };
}
