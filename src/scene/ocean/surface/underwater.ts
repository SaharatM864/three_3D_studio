import {
  cameraPosition,
  dot,
  float,
  If,
  mix,
  normalize,
  pow,
  reflect,
  refract,
  saturate,
  vec3,
} from "three/tsl";
import type { Node } from "three/webgpu";

import {
  SUBMERGE_RAMP,
  WINDOW_SUN_GAIN,
  WINDOW_SUN_SHARP,
  WINDOW_SUN_SOFT,
} from "../underwater/constants";
import { createWaterLighting } from "../underwater/radiance";
import { FAR_SINK, FAR_SINK_RANGE, N_WATER } from "./constants";
import { fresnelDielectric } from "./reflection";
import type { SkyLight } from "./sky-light";
import type { SurfaceUniforms } from "./uniforms";

export interface UnderwaterInputs {
  surface: Node<"vec3">;
  normal: Node<"vec3">;
  roughness: Node<"float">;
  view: Node<"vec3">;
  viewDistance: Node<"float">;
  waterHeight: Node<"float">;
  uniforms: SurfaceUniforms;
  light: SkyLight;
}

export function shadeUnderwater({
  surface,
  normal,
  roughness,
  view,
  viewDistance,
  waterHeight,
  uniforms,
  light,
}: UnderwaterInputs): Node<"vec3"> {
  const farSink = mix(
    float(1),
    float(FAR_SINK),
    saturate(viewDistance.div(FAR_SINK_RANGE))
  ).toVar();
  const result = surface.mul(farSink).toVar();
  const submerged = saturate(
    waterHeight.sub(cameraPosition.y).mul(SUBMERGE_RAMP).add(0.5)
  ).toVar();

  If(
    uniforms.underwaterActive.greaterThan(0.5).and(submerged.greaterThan(0)),
    () => {
      const under = saturate(dot(normal, view).negate().mul(8))
        .mul(submerged)
        .toVar();
      const water = createWaterLighting({
        light,
        albedo: uniforms.albedo,
        downwelling: uniforms.downwelling,
        cameraDepth: float(0),
      });
      const normalBelow = normal.negate().toVar();
      const cosUp = saturate(dot(normalBelow, view)).toVar();
      const fresnelUp = fresnelDielectric(cosUp, N_WATER).toVar();
      const refracted = normalize(
        refract(view.negate(), normalBelow, float(N_WATER)).add(
          vec3(0, 1e-5, 0)
        )
      ).toVar();
      const sharpness = mix(
        float(WINDOW_SUN_SHARP),
        float(WINDOW_SUN_SOFT),
        saturate(roughness.mul(2))
      );
      const sunSpot = light.sunColor.mul(
        pow(saturate(dot(refracted, light.sunDirection)), sharpness).mul(
          WINDOW_SUN_GAIN
        )
      );
      const window = light.sky(refracted).add(sunSpot);
      const internal = water.radiance(
        normalize(reflect(view.negate(), normalBelow))
      );
      const underLit = mix(window, internal, fresnelUp);
      const shaded = mix(surface, underLit, under);
      result.assign(mix(surface.mul(farSink), shaded, submerged));
    }
  );

  return result;
}
