import {
  float,
  Fn,
  fwidth,
  log2,
  max,
  min,
  normalize,
  positionGeometry,
  saturate,
  sqrt,
  texture,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import type { Node, Texture } from "three/webgpu";

import type { OceanCascadeMaps } from "../simulation/ocean-simulation";
import {
  CREST_RADIUS,
  DETAIL_MEAN,
  FEATURE_DIV,
  FOAM_RELIEF_FINE,
  FOAM_RELIEF_NORM,
  FOAM_RELIEF_OCT,
  RIPPLE_FINE,
  RIPPLE_FOOT,
  RIPPLE_GAIN,
  RIPPLE_OCT,
  RIPPLE_OCT_AMP,
  RIPPLE_STEP,
  RIPPLE_TILE,
  ROUGH_FLOOR,
  ROUGH_FOOT_SCALE,
  ROUGH_FROM_FOOT,
  ROUGH_FROM_VAR,
  ROUGH_MAX,
} from "./constants";

export interface WaveInputs {
  cascades: readonly OceanCascadeMaps[];
  detail: Texture;
  worldXZ: Node<"vec2">;
}

export interface WaveSurface {
  footprint: Node<"float">;
  envelope: Node<"float">;
  normal: Node<"vec3">;
  roughness: Node<"float">;
  reliefGradient: Node<"vec2">;
}

export interface WaveForm {
  swellHeight: Node<"float">;
  crestRelief: Node<"float">;
}

export function amplitudeEnvelope(
  detail: Texture,
  uv: Node<"vec2">
): Node<"float"> {
  const broad = texture(detail, uv.div(2400), 0).b;
  const near = texture(detail, uv.div(770).add(0.37), 0).a;
  return broad
    .sub(DETAIL_MEAN)
    .mul(1.35)
    .add(near.sub(DETAIL_MEAN).mul(0.75))
    .add(1)
    .clamp(0.6, 1.4);
}

export function displacedPosition({
  cascades,
  detail,
  worldXZ,
}: WaveInputs): Node<"vec3"> {
  return Fn(() => {
    const envelope = amplitudeEnvelope(detail, worldXZ).toVar();
    const displacement = vec3(0).toVar();
    cascades.forEach((cascade, index) => {
      const sample = texture(
        cascade.displacement,
        worldXZ.div(cascade.lengthScale),
        0
      ).xyz;
      displacement.addAssign(index <= 1 ? sample.mul(envelope) : sample);
    });
    return vec3(
      positionGeometry.x.add(displacement.x),
      displacement.y,
      positionGeometry.y.add(displacement.z)
    );
  })();
}

export function sampleWaveSurface(
  { cascades, detail, worldXZ }: WaveInputs,
  time: Node<"float">,
  detailStrength: Node<"float">
): WaveSurface {
  const footprint = max(fwidth(worldXZ.x), fwidth(worldXZ.y)).max(1e-3).toVar();
  const envelope = amplitudeEnvelope(detail, worldXZ).toVar();
  const slopes = vec4(0).toVar();
  const lostVariance = float(0).toVar();
  cascades.forEach((cascade, index) => {
    const texel = cascade.lengthScale / cascade.size;
    const lod = log2(footprint.div(texel)).max(0);
    const raw = texture(
      cascade.derivatives,
      worldXZ.div(cascade.lengthScale),
      lod
    ).toVar();
    const sample = (index <= 1 ? raw.mul(envelope) : raw).toVar();
    const weight = saturate(
      float(cascade.lengthScale / FEATURE_DIV).div(footprint)
    ).toVar();
    slopes.addAssign(sample.mul(weight));
    lostVariance.addAssign(
      sample.x
        .mul(sample.x)
        .add(sample.y.mul(sample.y))
        .mul(float(1).sub(weight.mul(weight)))
    );
  });
  const slopeX = slopes.x.div(float(1).add(slopes.z));
  const slopeZ = slopes.y.div(float(1).add(slopes.w));
  const normal = normalize(
    vec3(slopeX.negate(), float(1), slopeZ.negate())
  ).toVar();

  const rippleGradient = (scale: number, drift: Node<"vec2">) => {
    const uv = worldXZ.mul(scale).add(drift).toVar();
    const step = float(RIPPLE_STEP);
    const c0 = texture(detail, uv).toVar();
    const cx = texture(detail, uv.add(vec2(step, 0))).toVar();
    const cy = texture(detail, uv.add(vec2(0, step))).toVar();
    return vec4(
      cx.b.sub(c0.b).add(cx.a.sub(c0.a).mul(RIPPLE_FINE)),
      cy.b.sub(c0.b).add(cy.a.sub(c0.a).mul(RIPPLE_FINE)),
      cx.r.sub(c0.r).add(cx.g.sub(c0.g).mul(FOAM_RELIEF_FINE)),
      cy.r.sub(c0.r).add(cy.g.sub(c0.g).mul(FOAM_RELIEF_FINE))
    ).toVar();
  };
  const fadeA = saturate(float(RIPPLE_FOOT).div(footprint)).toVar();
  const fadeB = saturate(
    float(RIPPLE_FOOT / RIPPLE_OCT).div(footprint)
  ).toVar();
  const gradientA = rippleGradient(
    RIPPLE_TILE,
    vec2(time.mul(0.035), time.mul(0.022))
  );
  const gradientB = rippleGradient(
    RIPPLE_TILE * RIPPLE_OCT,
    vec2(time.mul(-0.09), time.mul(0.06))
  );
  const ripple = gradientA.xy
    .mul(fadeA)
    .add(gradientB.xy.mul(RIPPLE_OCT_AMP).mul(fadeB))
    .mul(RIPPLE_GAIN)
    .mul(detailStrength)
    .toVar();
  const reliefGradient = gradientB.zw
    .mul(fadeB)
    .add(gradientA.zw.mul(FOAM_RELIEF_OCT).mul(fadeA))
    .mul(FOAM_RELIEF_NORM)
    .toVar();
  lostVariance.addAssign(
    detailStrength
      .mul(detailStrength)
      .mul(float(2).sub(fadeA).sub(fadeB))
      .mul(0.35)
  );
  normal.assign(
    normalize(normal.add(vec3(ripple.x.negate(), 0, ripple.y.negate())))
  );

  const roughness = min(
    sqrt(
      float(ROUGH_FLOOR * ROUGH_FLOOR)
        .add(lostVariance.mul(ROUGH_FROM_VAR))
        .add(saturate(footprint.mul(ROUGH_FOOT_SCALE)).mul(ROUGH_FROM_FOOT))
    ),
    float(ROUGH_MAX)
  ).toVar();

  return { footprint, envelope, normal, roughness, reliefGradient };
}

export function sampleWaveForm(
  { cascades, worldXZ }: WaveInputs,
  { footprint, envelope }: WaveSurface
): WaveForm {
  const swellHeight = float(0).toVar();
  const crestRelief = float(0).toVar();
  cascades.slice(0, 2).forEach((cascade, index) => {
    const texel = cascade.lengthScale / cascade.size;
    const lod = log2(footprint.div(texel)).max(0).toVar();
    const blur = Math.max(0, Math.log2(CREST_RADIUS / texel));
    const uv = worldXZ.div(cascade.lengthScale);
    const here = texture(cascade.displacement, uv, lod).y.mul(envelope).toVar();
    const wide = texture(cascade.displacement, uv, lod.max(blur)).y.mul(
      envelope
    );
    crestRelief.addAssign(here.sub(wide));
    if (index === 0) swellHeight.assign(here);
  });
  return { swellHeight, crestRelief };
}
