import {
  abs,
  dot,
  float,
  fwidth,
  max,
  min,
  mix,
  normalize,
  PI,
  reflect,
  saturate,
  sqrt,
  texture,
  vec2,
  vec3,
} from "three/tsl";
import type { Node } from "three/webgpu";

import type { OceanCascadeMaps } from "../simulation/ocean-simulation";
import {
  ETA_AIR_WATER,
  GLINT_CLAMP,
  GRAZE_AMOUNT,
  GRAZE_RANGE,
  REFL_BAND,
  REFL_BAND_DESAT,
  REFL_BAND_ELEV,
  REFL_CEIL,
  REFL_CHROMA,
  REFL_DESAT,
  REFL_DESAT_CAP,
  REFL_FILTER,
  REFL_GREY,
  REFL_NEAR,
  REFL_RELAX,
  REFL_RELAX_MAX,
  REFL_WARM_GAIN,
  SPEC_AA_DESAT,
  SPEC_AA_VAR,
  SPEC_KNEE,
  SPEC_MAX,
  SPEC_ROUGH_MAX,
  SPEC_ROUGH_MIN,
  SPEC_SPREAD,
  SPEC_SPREAD_RANGE,
  SPEC_WHITE,
} from "./constants";
import { luminance, type SkyLight } from "./sky-light";

const UP = vec3(0, 1, 0);

export interface ViewGeometry {
  normal: Node<"vec3">;
  view: Node<"vec3">;
  viewDistance: Node<"float">;
  roughness: Node<"float">;
}

export interface SkyReflection {
  fresnel: Node<"float">;
  fresnelSpecular: Node<"float">;
  radiance: Node<"vec3">;
}

export interface SunSpecular {
  broad: Node<"vec3">;
  total: Node<"vec3">;
}

export function fresnelDielectric(
  cosIncident: Node<"float">,
  eta: number
): Node<"float"> {
  const ci = abs(cosIncident).toVar();
  const k = float(1)
    .sub(float(eta * eta).mul(float(1).sub(ci.mul(ci))))
    .toVar();
  const ct = sqrt(max(k, float(0))).toVar();
  const ec = ci.mul(eta).toVar();
  const et = ct.mul(eta).toVar();
  const rs = ec
    .sub(ct)
    .div(max(ec.add(ct), float(1e-5)))
    .toVar();
  const rp = et
    .sub(ci)
    .div(max(et.add(ci), float(1e-5)))
    .toVar();
  return rs.mul(rs).add(rp.mul(rp)).mul(0.5);
}

export function shadeSkyReflection(
  { normal, view, viewDistance, roughness }: ViewGeometry,
  light: SkyLight
): SkyReflection {
  const NoV = saturate(dot(normal, view)).toVar();
  const fresnel = fresnelDielectric(NoV, ETA_AIR_WATER).toVar();
  const fresnelSpecular = fresnel.toVar();
  const distance = saturate(viewDistance.div(GRAZE_RANGE)).toVar();
  fresnel.mulAssign(mix(float(REFL_NEAR), float(1), distance));
  fresnel.assign(mix(fresnel, float(1), distance.mul(GRAZE_AMOUNT)));
  fresnel.assign(min(fresnel, float(REFL_CEIL)));

  const mirror = reflect(view.negate(), normal);
  const ray = normalize(
    mix(
      mirror,
      reflect(view.negate(), UP),
      saturate(roughness.mul(REFL_RELAX)).mul(REFL_RELAX_MAX)
    )
  ).toVar();
  const azimuth = normalize(vec2(ray.x, ray.z).add(vec2(1e-4, 1e-4))).toVar();
  const elevation = ray.y.max(ray.y.mul(-0.35).add(0.007)).toVar();
  const flat = sqrt(saturate(float(1).sub(elevation.mul(elevation)))).toVar();
  const radiance = light
    .sky(vec3(azimuth.x.mul(flat), elevation, azimuth.y.mul(flat)))
    .toVar();
  radiance.mulAssign(float(1).sub(saturate(ray.y.negate().mul(5)).mul(0.6)));

  const peak = max(max(radiance.x, radiance.y), radiance.z);
  radiance.mulAssign(
    float(1).div(
      float(1).add(max(peak.sub(1), 0).mul(roughness.mul(GLINT_CLAMP)))
    )
  );
  radiance.mulAssign(mix(vec3(1), vec3(...REFL_FILTER), roughness));

  const band = float(1)
    .sub(saturate(elevation.mul(REFL_BAND_ELEV)))
    .mul(0.4)
    .add(0.6)
    .toVar();
  const warm = saturate(radiance.x.sub(radiance.z).mul(REFL_WARM_GAIN)).toVar();
  const bandLuminance = luminance(radiance).toVar();
  const notSun = saturate(float(3).sub(bandLuminance).mul(0.5)).toVar();
  radiance.assign(
    mix(
      radiance,
      vec3(...REFL_BAND).mul(bandLuminance),
      warm.mul(band).mul(REFL_BAND_DESAT).mul(notSun)
    )
  );

  const reflectedLuminance = luminance(radiance);
  const grey = vec3(...REFL_GREY).mul(reflectedLuminance);
  radiance.assign(
    mix(
      radiance,
      mix(grey, radiance, float(REFL_CHROMA)),
      saturate(roughness.mul(REFL_DESAT)).mul(REFL_DESAT_CAP)
    )
  );
  const normalVariance = fwidth(normal.x).add(fwidth(normal.z)).toVar();
  radiance.assign(
    mix(radiance, grey, saturate(normalVariance.mul(2.5)).mul(0.55))
  );

  return { fresnel, fresnelSpecular, radiance };
}

export function foamRoughness(
  cascades: readonly OceanCascadeMaps[],
  worldXZ: Node<"vec2">,
  foamThreshold: Node<"float">,
  foamScale: Node<"float">
): Node<"float"> {
  const cascade = cascades[Math.min(1, cascades.length - 1)];
  const turbulence = texture(
    cascade.displacement,
    worldXZ.div(cascade.lengthScale),
    3
  ).w;
  return saturate(foamThreshold.sub(turbulence).mul(foamScale)).toVar();
}

export function shadeSunSpecular(
  { normal, view, viewDistance, roughness }: ViewGeometry,
  fresnelSpecular: Node<"float">,
  foamRough: Node<"float">,
  light: SkyLight
): SunSpecular {
  const sunDirection = light.sunDirection;
  const half = normalize(view.add(sunDirection));
  const normalVariance = fwidth(normal.x).add(fwidth(normal.z)).toVar();
  const specularRoughness = min(
    max(
      sqrt(
        roughness
          .mul(roughness)
          .add(saturate(viewDistance.div(SPEC_SPREAD_RANGE)).mul(SPEC_SPREAD))
          .add(saturate(normalVariance.mul(SPEC_AA_VAR)).mul(0.06))
          .add(foamRough.mul(0.22))
      ),
      float(SPEC_ROUGH_MIN)
    ),
    float(SPEC_ROUGH_MAX)
  ).toVar();
  const a2 = specularRoughness
    .mul(specularRoughness)
    .mul(specularRoughness)
    .mul(specularRoughness)
    .toVar();
  const NoH = saturate(dot(normal, half)).toVar();
  const denominator = NoH.mul(NoH).mul(a2.sub(1)).add(1);
  const ggx = a2
    .div(denominator.mul(denominator).mul(PI))
    .mul(saturate(dot(normal, sunDirection)))
    .toVar();

  const sunColor = light.sunColor;
  const base = mix(
    sunColor,
    vec3(luminance(sunColor)),
    float(SPEC_WHITE)
  ).toVar();
  const tint = mix(
    base,
    vec3(luminance(base)),
    saturate(normalVariance.mul(3)).mul(SPEC_AA_DESAT)
  ).toVar();
  const broad = tint
    .mul(ggx.div(ggx.add(SPEC_KNEE)).mul(SPEC_MAX))
    .mul(fresnelSpecular)
    .toVar();
  const glint = max(ggx.sub(1.5), float(0)).toVar();
  const sharp = tint
    .mul(
      glint
        .div(glint.add(6))
        .mul(0.5 * SPEC_MAX)
        .mul(light.specularBoost)
    )
    .mul(fresnelSpecular);
  return { broad, total: broad.add(sharp) };
}
