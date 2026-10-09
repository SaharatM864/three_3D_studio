import {
  dot,
  float,
  log2,
  max,
  min,
  mix,
  pow,
  saturate,
  smoothstep,
  sqrt,
  texture,
  vec2,
  vec3,
} from "three/tsl";
import type { Node, Texture } from "three/webgpu";

import type { OceanCascadeMaps } from "../simulation/ocean-simulation";
import {
  AGE_END,
  AGE_FAR_HI,
  AGE_FAR_LO,
  APRON_ALPHA,
  APRON_COV_GAIN,
  APRON_DROP,
  APRON_FOOT,
  APRON_SPAN,
  BUB_CONTRAST,
  BUB_DEPTH,
  BUB_LOD_MIN,
  BUB_PLUME_MAX,
  BUB_SUN_T,
  BUB_TILE,
  BUB_VY_MIN,
  CARVE_FOOT_F,
  CARVE_ROT_C,
  CARVE_ROT_S,
  CARVE_TILE_C,
  CARVE_TILE_F,
  CARVE_TRIM,
  CARVE_W_C,
  CARVE_W_F,
  CARVE_WARP_AMP,
  CARVE_WARP_ORTH,
  CARVE_WARP_RHO,
  CARVE_WARP_TILE,
  DETAIL_MEAN,
  DETAIL_STD,
  DETAIL_TEXTURE_SIZE,
  FOAM_AMB,
  FOAM_CEIL,
  FOAM_COLOR_HEX,
  FOAM_FWD,
  FOAM_RED_AGED,
  FOAM_RELIEF_CLAMP,
  FOAM_SPEC_FILM,
  FOAM_SUN,
  FOAM_WRAP,
  LACE_HALF,
  LACE_MIN,
  MILK_PATH,
  RAMP_FULL,
  RAMP_IN,
  RAMP_MED_IN,
  RAMP_MED_TOP,
  RAMP_SPARSE_MIN,
  SCUD_OCC_MIN,
  SCUD_TONE,
  SPARSE_CLIP,
  TONE_FAR,
  TONE_FLOOR,
} from "./constants";
import { luminance, type SkyLight } from "./sky-light";
import { colorVec3, expVec3 } from "./vector-math";
import type { WaterBody } from "./water-body";
import type { WaveSurface } from "./waves";

export interface FoamUniformNodes {
  threshold: Node<"float">;
  scale: Node<"float">;
  brightness: Node<"float">;
  relief: Node<"float">;
  milk: Node<"float">;
}

export interface FoamInputs {
  cascades: readonly OceanCascadeMaps[];
  detail: Texture;
  worldXZ: Node<"vec2">;
  time: Node<"float">;
  normal: Node<"vec3">;
  view: Node<"vec3">;
  water: Node<"vec3">;
  fresnel: Node<"float">;
  specularBroad: Node<"vec3">;
  surface: WaveSurface;
  body: WaterBody;
  foam: FoamUniformNodes;
  light: SkyLight;
}

export function shadeFoam({
  cascades,
  detail,
  worldXZ,
  time,
  normal,
  view,
  water,
  fresnel,
  specularBroad,
  surface,
  body,
  foam,
  light,
}: FoamInputs): Node<"vec3"> {
  const { footprint, envelope, reliefGradient } = surface;
  const sunDirection = light.sunDirection;
  const foamColor = colorVec3(FOAM_COLOR_HEX);
  const result = vec3(water).toVar();

  const raw = float(0).toVar();
  const turbulenceMin = float(1).toVar();
  for (const cascade of cascades.slice(0, -1)) {
    const turbulence = texture(
      cascade.displacement,
      worldXZ.div(cascade.lengthScale)
    ).w.toVar();
    turbulenceMin.assign(min(turbulenceMin, turbulence));
    raw.addAssign(saturate(foam.threshold.sub(turbulence).mul(foam.scale)));
  }
  const cover = saturate(raw.mul(envelope).mul(envelope)).toVar();

  const warpSample = texture(
    detail,
    worldXZ.div(CARVE_WARP_TILE).add(0.23)
  ).toVar();
  const warpX = warpSample.b.sub(DETAIL_MEAN).toVar();
  const warpY = warpSample.a
    .sub(DETAIL_MEAN)
    .sub(warpX.mul(CARVE_WARP_RHO))
    .mul(CARVE_WARP_ORTH);
  const coarseUV = worldXZ.add(vec2(warpX, warpY).mul(CARVE_WARP_AMP)).toVar();
  const fineUV = vec2(
    coarseUV.x.mul(CARVE_ROT_C).sub(coarseUV.y.mul(CARVE_ROT_S)),
    coarseUV.y.mul(CARVE_ROT_C).add(coarseUV.x.mul(CARVE_ROT_S))
  ).toVar();
  const coarse = texture(
    detail,
    coarseUV.div(CARVE_TILE_C).add(vec2(time.mul(0.012), time.mul(0.008)))
  ).toVar();
  const fine = texture(
    detail,
    fineUV.div(CARVE_TILE_F).add(vec2(time.mul(-0.02), time.mul(0.015)))
  ).toVar();
  const densityA = coarse.b.toVar();
  const densityB = fine.g.toVar();

  const fineFade = saturate(float(CARVE_FOOT_F).div(footprint)).toVar();
  const ramp = smoothstep(RAMP_IN, RAMP_FULL, cover).toVar();
  const sparseWeight = mix(float(RAMP_SPARSE_MIN), float(1), ramp)
    .mul(fineFade)
    .toVar();
  const mediumWeight = smoothstep(RAMP_MED_IN, RAMP_FULL, cover)
    .mul(RAMP_MED_TOP)
    .mul(fineFade)
    .toVar();
  const sparseDeviation = max(
    float(DETAIL_MEAN).sub(fine.r),
    float(SPARSE_CLIP)
  ).toVar();
  const deviation = densityA
    .sub(DETAIL_MEAN)
    .add(sparseDeviation.mul(sparseWeight))
    .add(densityB.sub(DETAIL_MEAN).mul(mediumWeight))
    .toVar();
  const sigmaMix = sqrt(
    sparseWeight.mul(sparseWeight).add(mediumWeight.mul(mediumWeight)).add(1)
  ).toVar();
  const sigmaShip = sqrt(
    fineFade
      .mul(fineFade)
      .mul(CARVE_W_F * CARVE_W_F)
      .add(CARVE_W_C * CARVE_W_C)
  ).toVar();
  const carve = deviation
    .mul(sigmaShip.div(sigmaMix).mul(CARVE_TRIM))
    .add(DETAIL_MEAN)
    .toVar();
  const edge = float(0.6).sub(cover.mul(0.42)).toVar();
  const coverage = smoothstep(edge, edge.add(0.15), carve)
    .mul(saturate(cover.mul(2.4)))
    .toVar();

  const bubbleOffset = vec2(view.x, view.z)
    .mul(float(BUB_DEPTH).div(max(view.y, float(BUB_VY_MIN))))
    .toVar();
  const bubbleUV = worldXZ
    .sub(bubbleOffset)
    .div(BUB_TILE)
    .add(vec2(time.mul(-0.011), time.mul(0.007)))
    .toVar();
  const bubbleLod = log2(footprint.div(BUB_TILE / DETAIL_TEXTURE_SIZE))
    .max(float(BUB_LOD_MIN))
    .toVar();
  const plume = float(1)
    .add(
      texture(detail, bubbleUV, bubbleLod)
        .b.sub(DETAIL_MEAN)
        .div(DETAIL_STD)
        .mul(BUB_CONTRAST)
    )
    .clamp(0, BUB_PLUME_MAX)
    .toVar();
  const aerated = saturate(cover.mul(plume)).toVar();

  const ambientFoam = light.ambientLevel.mul(FOAM_AMB).toVar();
  const sunFoam = light.sunLevel.mul(FOAM_SUN).toVar();
  const litBubbles = ambientFoam
    .add(body.sunFacing.mul(sunFoam).mul(BUB_SUN_T))
    .mul(body.skyVisibility)
    .mul(body.groupOcclusion)
    .toVar();
  const milk = foamColor
    .mul(SCUD_TONE)
    .mul(expVec3(body.absorption.mul(MILK_PATH).negate()))
    .mul(litBubbles)
    .toVar();
  result.assign(
    mix(result, milk, aerated.mul(foam.milk).mul(float(1).sub(fresnel)))
  );

  const apronEdge = edge.sub(APRON_DROP).toVar();
  const apron = smoothstep(apronEdge, apronEdge.add(APRON_SPAN), carve)
    .mul(saturate(cover.mul(APRON_COV_GAIN)))
    .mul(saturate(float(APRON_FOOT).div(footprint)))
    .toVar();
  const litScud = ambientFoam
    .add(body.sunFacing.mul(sunFoam))
    .mul(max(body.skyVisibility.mul(body.groupOcclusion), float(SCUD_OCC_MIN)))
    .toVar();
  const scud = foamColor.mul(SCUD_TONE).mul(litScud).toVar();
  result.assign(
    mix(
      result,
      scud,
      saturate(apron.sub(coverage)).mul(float(1).sub(coverage)).mul(APRON_ALPHA)
    )
  );

  const ageU = saturate(float(1).sub(turbulenceMin)).toVar();
  const ageU2 = ageU.mul(ageU).toVar();
  const ageRaw = ageU2.mul(ageU2).toVar();
  const far = saturate(
    footprint.sub(AGE_FAR_LO).div(AGE_FAR_HI - AGE_FAR_LO)
  ).toVar();
  const agePigment = mix(ageRaw, float(0.5), far).toVar();
  const death = pow(
    max(float(1).sub(foam.threshold), float(0)),
    float(4)
  ).toVar();
  const ageTone = float(AGE_END)
    .add(
      ageRaw
        .sub(death)
        .mul(float(1 - AGE_END).div(max(float(1).sub(death), float(1e-4))))
    )
    .clamp(AGE_END, 1)
    .toVar();
  const laceSolid = saturate(
    densityB.sub(DETAIL_MEAN).div(LACE_HALF).mul(0.5).add(0.5)
  ).toVar();
  const lace = mix(float(LACE_MIN), float(1), laceSolid).toVar();
  const tone = mix(
    max(ageTone.mul(lace), float(TONE_FLOOR)),
    float(TONE_FAR),
    far
  ).toVar();

  const NoV = saturate(dot(normal, view));
  const wrap = saturate(
    dot(normal, sunDirection)
      .add(FOAM_WRAP)
      .div(1 + FOAM_WRAP)
  ).toVar();
  const sunTerm = min(
    wrap
      .mul(FOAM_SUN)
      .add(
        body.forwardScatter.mul(float(1).sub(NoV)).mul(ageTone).mul(FOAM_FWD)
      ),
    float(FOAM_SUN)
  )
    .mul(light.sunLevel)
    .toVar();
  const reliefLight = dot(
    vec3(reliefGradient.x.negate(), 0, reliefGradient.y.negate()),
    sunDirection
  )
    .clamp(-FOAM_RELIEF_CLAMP, FOAM_RELIEF_CLAMP)
    .mul(foam.relief)
    .toVar();
  const foamHue = foamColor.div(max(luminance(foamColor), float(1e-4)));
  const shaded = foamHue
    .mul(mix(vec3(1), vec3(FOAM_RED_AGED, 1, 1), float(1).sub(agePigment)))
    .mul(tone.mul(foam.brightness))
    .mul(ambientFoam.add(sunTerm).mul(float(1).add(reliefLight)))
    .toVar();
  const peak = shaded.r.max(shaded.g).max(shaded.b).toVar();
  shaded.mulAssign(min(float(1), float(FOAM_CEIL).div(max(peak, float(1e-4)))));

  result.assign(mix(result, shaded, coverage));
  result.addAssign(
    specularBroad
      .mul(coverage)
      .mul(float(FOAM_SPEC_FILM).mul(float(1).sub(agePigment)))
  );
  return result;
}
