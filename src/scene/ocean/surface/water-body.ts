import {
  abs,
  dot,
  float,
  max,
  mix,
  positionWorld,
  pow,
  saturate,
  sqrt,
  texture,
  vec2,
  vec3,
} from "three/tsl";
import type { Node, Texture } from "three/webgpu";

import {
  BODY_BIAS,
  BODY_SOFT,
  CHOP_LIFT,
  DEEP_COLOR_HEX,
  ETA_AIR_WATER,
  ETA_AIR_WATER_2,
  GROUP_DARK,
  GROUP_SCALE,
  GROUP_SOFT,
  HEIGHT_SOFT,
  LIP_BASE,
  LIP_TIP,
  MASS_AMOUNT,
  MASS_FINE,
  MASS_HUE,
  MASS_HUE_AMOUNT,
  MASS_NEAR,
  MASS_SCALE,
  MASS_SOFT,
  MU_CLEAR,
  MU_TURBID,
  SCATTER_BASE,
  SCATTER_COLOR_HEX,
  SCATTER_GAIN,
  SEA,
  SHADOW_LUM,
  SHALLOW_MAX,
  SKY_VIS_MIN,
  SSS_DEPTH,
  SSS_G,
  SSS_GAIN,
  SSS_MAX,
  WAVE_SCALE,
  type Rgb,
  type SeaPalette,
} from "./constants";
import { fresnelDielectric } from "./reflection";
import { luminance, type SkyLight } from "./sky-light";
import { colorVec3, expVec3 } from "./vector-math";
import type { WaveForm } from "./waves";

const UP = vec3(0, 1, 0);

export type SeaColors = Record<keyof SeaPalette, Node<"vec3">>;

export interface WaterBodyInputs {
  detail: Texture;
  worldXZ: Node<"vec2">;
  time: Node<"float">;
  normal: Node<"vec3">;
  view: Node<"vec3">;
  sea: SeaColors;
  subsurface: Node<"float">;
  form: WaveForm;
  light: SkyLight;
}

export interface WaterBody {
  color: Node<"vec3">;
  deepBody: Node<"vec3">;
  absorption: Node<"vec3">;
  skyVisibility: Node<"float">;
  groupOcclusion: Node<"float">;
  facing: Node<"float">;
  sunFacing: Node<"float">;
  forwardScatter: Node<"float">;
}

export function seaColors(palette: Node<"float">): SeaColors {
  const pick = ([green, blue]: readonly [Rgb, Rgb]) =>
    mix(vec3(...green), vec3(...blue), palette);
  return {
    trough: pick(SEA.trough),
    abyss: pick(SEA.abyss),
    body: pick(SEA.body),
    crest: pick(SEA.crest),
    bodyBlue: pick(SEA.bodyBlue),
    scatter: pick(SEA.scatter),
  };
}

export function softPositive(x: Node<"float">, k: number): Node<"float"> {
  return x.add(sqrt(x.mul(x).add(k * k))).mul(0.5);
}

export function hgForward(g: number, cosTheta: Node<"float">): Node<"float"> {
  const r = float((1 - g) * (1 - g))
    .div(max(float(1 + g * g).sub(cosTheta.mul(2 * g)), float(1e-4)))
    .toVar();
  return r.mul(sqrt(r));
}

export function shadeWaterBody({
  detail,
  worldXZ,
  time,
  normal,
  view,
  sea,
  subsurface,
  form,
  light,
}: WaterBodyInputs): WaterBody {
  const sunDirection = light.sunDirection;
  const heightN = positionWorld.y.div(WAVE_SCALE).toVar();
  const lift = heightN
    .div(abs(heightN).add(HEIGHT_SOFT))
    .mul(0.5)
    .add(0.5)
    .toVar();
  const facing = saturate(dot(normal, UP)).toVar();

  const groupN = form.swellHeight.div(GROUP_SCALE).toVar();
  const group = groupN
    .div(abs(groupN).add(GROUP_SOFT))
    .mul(0.5)
    .add(0.5)
    .toVar();
  const chopS = positionWorld.y.sub(form.swellHeight).div(1.6).toVar();
  const chopP = softPositive(chopS, 0.3).toVar();
  const chop = chopP.div(chopP.add(1)).toVar();
  const crestN = form.crestRelief.div(SSS_DEPTH).toVar();
  const crestP = softPositive(crestN, 0.15).toVar();
  const thin = crestP.div(crestP.add(0.7)).toVar();

  const mass = texture(
    detail,
    worldXZ.mul(MASS_SCALE).add(vec2(time.mul(0.0016), time.mul(-0.0011)))
  )
    .b.add(
      texture(
        detail,
        worldXZ.mul(MASS_NEAR).add(vec2(time.mul(-0.01), time.mul(0.008)))
      ).b.mul(0.6)
    )
    .add(
      texture(
        detail,
        worldXZ.mul(MASS_FINE).add(vec2(time.mul(0.02), time.mul(0.03)))
      ).a.mul(0.3)
    )
    .div(1.9)
    .sub(0.5)
    .mul(MASS_AMOUNT)
    .toVar();
  const massT = mass.div(abs(mass).add(MASS_SOFT)).mul(0.5).add(0.5).toVar();
  const absorption = mix(vec3(...MU_TURBID), vec3(...MU_CLEAR), massT).toVar();
  const abyss = mix(colorVec3(DEEP_COLOR_HEX), sea.abyss, float(0.65)).toVar();
  const deepBody = mix(sea.body, abyss, massT).toVar();
  const hue = texture(
    detail,
    worldXZ.mul(MASS_HUE).add(vec2(time.mul(-0.0022), time.mul(0.0017)))
  )
    .a.sub(0.5)
    .mul(2.2)
    .toVar();
  deepBody.assign(
    mix(
      deepBody,
      sea.bodyBlue,
      hue.div(abs(hue).add(0.9)).mul(0.5).add(0.5).mul(MASS_HUE_AMOUNT)
    )
  );

  const heightBiased = heightN.add(BODY_BIAS).toVar();
  const rise = heightBiased
    .div(abs(heightBiased).add(BODY_SOFT))
    .mul(0.5)
    .add(0.5)
    .toVar();
  const body = mix(sea.trough, deepBody, rise).toVar();

  const shallowIn = lift
    .sub(0.46)
    .mul(2)
    .add(thin.mul(1.6))
    .add(chop.mul(0.8))
    .toVar();
  const shallowP = softPositive(shallowIn, 0.22).toVar();
  const shallow = shallowP
    .div(shallowP.add(1))
    .mul(SHALLOW_MAX)
    .mul(mix(float(0.3), float(1), thin))
    .mul(float(0.85).add(facing.mul(0.15)))
    .toVar();
  body.assign(
    mix(
      body,
      mix(colorVec3(SCATTER_COLOR_HEX), sea.crest, float(0.72)),
      shallow
    )
  );

  const skyVisibility = float(SKY_VIS_MIN)
    .add(saturate(lift.mul(1.15)).mul(1 - SKY_VIS_MIN))
    .toVar();
  const groupOcclusion = float(1)
    .sub(float(GROUP_DARK).mul(float(1).sub(group)))
    .add(chop.mul(CHOP_LIFT).mul(float(1).sub(group)))
    .toVar();
  const sunWrap = pow(
    saturate(dot(normal, sunDirection).mul(0.55).add(0.45)),
    float(1.7)
  ).toVar();
  const ambientOcclusion = mix(
    float(0.36).add(facing.mul(0.64)),
    float(0.72).add(facing.mul(0.28)),
    thin
  ).toVar();
  body.mulAssign(ambientOcclusion.mul(skyVisibility).mul(groupOcclusion));

  const ambient = light.ambient;
  const shadowTint = ambient
    .div(max(luminance(ambient), float(1e-4)))
    .mul(light.ambientLevel.mul(SHADOW_LUM))
    .toVar();
  body.mulAssign(
    mix(
      shadowTint,
      mix(light.sunColor, vec3(light.ambientLevel), float(0.28)).mul(1.26),
      saturate(sunWrap.add(thin.mul(0.35)))
    )
  );

  const sunFacing = saturate(dot(normal, sunDirection)).toVar();
  body.addAssign(
    sea.scatter
      .mul(light.sunColor)
      .mul(sunFacing)
      .mul(mix(float(SCATTER_BASE), float(1), thin))
      .mul(groupOcclusion)
      .mul(SCATTER_GAIN)
  );

  const NoV = saturate(dot(normal, view));
  const cosIn = saturate(dot(normal, sunDirection).negate()).toVar();
  const transmitted = float(1)
    .sub(fresnelDielectric(cosIn, ETA_AIR_WATER))
    .toVar();
  const forwardScatter = hgForward(
    SSS_G,
    saturate(dot(view, sunDirection.negate()))
  ).toVar();
  const cosT = sqrt(
    float(1).sub(float(ETA_AIR_WATER_2).mul(float(1).sub(NoV.mul(NoV))))
  ).toVar();
  const lipDepth = mix(float(LIP_BASE), float(LIP_TIP), thin)
    .div(max(cosT, float(0.1)))
    .toVar();
  const volumeTransmittance = expVec3(
    absorption.mul(lipDepth).negate()
  ).toVar();
  const thinness = thin.mul(float(0.25).add(lift.mul(0.9))).toVar();
  const sss = forwardScatter
    .mul(cosIn)
    .mul(transmitted)
    .mul(thinness)
    .mul(subsurface)
    .mul(SSS_GAIN)
    .toVar();
  const glow = volumeTransmittance
    .mul(light.sunColor)
    .mul(sss.div(sss.add(1)).mul(SSS_MAX))
    .toVar();

  return {
    color: body.add(glow),
    deepBody,
    absorption,
    skyVisibility,
    groupOcclusion,
    facing,
    sunFacing,
    forwardScatter,
  };
}
