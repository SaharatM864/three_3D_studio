import {
  abs,
  exp,
  exp2,
  float,
  Fn,
  If,
  log2,
  max,
  min,
  mix,
  normalize,
  smoothstep,
  texture,
  vec2,
  vec4,
} from "three/tsl";
import type { Node, NodeBuilder, Texture } from "three/webgpu";

import { getAtmosphereContext } from "../../atmosphere/takram";
import type { WaterLightSource } from "../../atmosphere/shadowed-light-node";
import type { OceanCascadeMaps } from "../simulation/ocean-simulation";
import { N_WATER } from "../surface/constants";
import type { SurfaceUniforms } from "../surface/uniforms";
import { amplitudeEnvelope } from "../surface/waves";
import {
  CAUSTIC_BLUR,
  CAUSTIC_CASCADES,
  CAUSTIC_EPSILON,
  CAUSTIC_FADE,
  CAUSTIC_MAX,
  CAUSTIC_SUN_ELEVATION,
} from "./constants";
import { refractedSunTravel } from "./radiance";

const FOCUS_GAIN = 1 - 1 / N_WATER;

export function createCausticsLight(
  cascades: readonly OceanCascadeMaps[],
  detail: Texture,
  uniforms: SurfaceUniforms
): WaterLightSource {
  return {
    waterLight(position: Node<"vec3">, builder: NodeBuilder): Node<"float"> {
      const atmosphere = getAtmosphereContext(builder);
      const sunDirection = normalize(
        atmosphere.matrixECEFToWorld.mul(vec4(atmosphere.sunDirectionECEF, 0))
          .xyz
      );

      return Fn(() => {
        const result = float(1).toVar();

        If(
          uniforms.underwaterActive
            .greaterThan(0.5)
            .and(position.y.lessThan(0)),
          () => {
            const depth = position.y.negate().toVar();
            const travel = refractedSunTravel(sunDirection).toVar();
            const path = depth.div(max(travel.y.negate(), float(0.2))).toVar();
            const surfaceXZ = position.xz.sub(travel.xz.mul(path)).toVar();
            const lod = log2(depth.mul(CAUSTIC_BLUR).add(1)).toVar();
            const envelope = amplitudeEnvelope(detail, surfaceXZ).toVar();
            const laplacian = float(0).toVar();

            for (const index of CAUSTIC_CASCADES) {
              const cascade = cascades[index];
              const step = float(cascade.lengthScale / cascade.size)
                .mul(exp2(lod))
                .toVar();
              const center = surfaceXZ.div(cascade.lengthScale).toVar();
              const offset = step.div(cascade.lengthScale).toVar();
              const slopeAt = (du: Node<"float">, dv: Node<"float">) =>
                texture(cascade.derivatives, center.add(vec2(du, dv)), lod);
              const curvature = slopeAt(offset, float(0))
                .x.sub(slopeAt(offset.negate(), float(0)).x)
                .add(
                  slopeAt(float(0), offset).y.sub(
                    slopeAt(float(0), offset.negate()).y
                  )
                )
                .div(step.mul(2));
              laplacian.addAssign(
                index <= 1 ? curvature.mul(envelope) : curvature
              );
            }

            const focus = float(1).add(path.mul(FOCUS_GAIN).mul(laplacian));
            const intensity = min(
              float(1).div(max(abs(focus), float(CAUSTIC_EPSILON))),
              float(CAUSTIC_MAX)
            );
            const strength = uniforms.caustics
              .mul(exp(depth.mul(-CAUSTIC_FADE)))
              .mul(
                smoothstep(
                  CAUSTIC_SUN_ELEVATION[0],
                  CAUSTIC_SUN_ELEVATION[1],
                  sunDirection.y
                )
              );
            result.assign(max(mix(float(1), intensity, strength), float(0)));
          }
        );

        return result;
      })();
    },
  };
}
