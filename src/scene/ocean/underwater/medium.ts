import type { Camera } from "three";
import {
  clamp,
  dot,
  exp2,
  float,
  Fn,
  getViewPosition,
  If,
  length,
  log,
  log2,
  max,
  min,
  mix,
  normalize,
  reference,
  saturate,
  select,
  uv,
  vec3,
  vec4,
} from "three/tsl";
import type { Node, TextureNode } from "three/webgpu";

import { createSkyLight, luminance } from "../surface/sky-light";
import type { SurfaceUniforms } from "../surface/uniforms";
import { expVec3 } from "../surface/vector-math";
import {
  EXPOSURE_RAMP,
  LENS_DISTANCE,
  LENS_SOFTNESS,
  SKY_DISTANCE,
  UNDERWATER_EV_ADAPT,
  UNDERWATER_EV_BASE,
  UNDERWATER_EV_MAX,
  WB_GAIN_MAX,
} from "./constants";
import type { WaterProbe } from "./probe";
import { createWaterLighting } from "./radiance";

export interface UnderwaterMediumInput {
  above: Node<"vec4">;
  scene: Node<"vec4">;
  depth: TextureNode;
  camera: Camera;
  reversedDepth: boolean;
}

export interface UnderwaterMedium {
  apply(input: UnderwaterMediumInput): Node<"vec4">;
}

export function createUnderwaterMedium(
  uniforms: SurfaceUniforms,
  probe: WaterProbe
): UnderwaterMedium {
  return {
    apply({ above, scene, depth, camera, reversedDepth }) {
      const projectionInverse = reference(
        "projectionMatrixInverse",
        "mat4",
        camera
      );
      const cameraWorld = reference("matrixWorld", "mat4", camera);

      return Fn((builder) => {
        const result = above.toVar();
        const origin = cameraWorld.mul(vec4(0, 0, 0, 1)).xyz.toVar();
        const reachesLens = probe.height
          .add(LENS_DISTANCE + LENS_SOFTNESS)
          .greaterThan(origin.y);

        If(uniforms.underwaterActive.greaterThan(0.5).and(reachesLens), () => {
          const depthValue = depth.sample(uv()).x.toVar();
          const position = cameraWorld
            .mul(vec4(getViewPosition(uv(), depthValue, projectionInverse), 1))
            .xyz.toVar();
          const ray = position.sub(origin).toVar();
          const direction = normalize(ray).toVar();
          const isSky = reversedDepth
            ? depthValue.lessThanEqual(0)
            : depthValue.greaterThanEqual(1);
          const distance = select(isSky, float(SKY_DISTANCE), length(ray));
          const cameraDepth = max(probe.height.sub(origin.y), float(0)).toVar();

          const lens = origin.add(direction.mul(LENS_DISTANCE)).toVar();
          const waterline = probe.height.add(
            dot(probe.slope, lens.xz.sub(origin.xz))
          );
          const submerged = saturate(
            waterline.sub(lens.y).div(LENS_SOFTNESS).add(0.5)
          );

          const light = createSkyLight(builder, uniforms.luminanceGain);
          const water = createWaterLighting({
            light,
            albedo: uniforms.albedo,
            downwelling: uniforms.downwelling,
            cameraDepth,
          });
          const illuminance = max(
            luminance(water.depthTransmittance),
            float(1e-6)
          ).toVar();
          const whiteBalance = clamp(
            expVec3(
              uniforms.downwelling
                .mul(cameraDepth)
                .add(log(illuminance))
                .mul(uniforms.whiteBalance)
            ),
            vec3(1 / WB_GAIN_MAX),
            vec3(WB_GAIN_MAX)
          );
          const exposure = min(
            log2(illuminance).mul(-UNDERWATER_EV_ADAPT).add(UNDERWATER_EV_BASE),
            float(UNDERWATER_EV_MAX)
          ).mul(
            saturate(probe.height.sub(origin.y).div(EXPOSURE_RAMP).add(0.5))
          );
          const lit = scene.rgb.mul(
            expVec3(
              uniforms.downwelling
                .mul(max(position.y.negate(), float(0)))
                .negate()
            )
          );
          const transmittance = expVec3(
            uniforms.extinction.mul(distance).negate()
          ).toVar();
          const direct = lit.mul(transmittance);
          const scattered = water
            .radiance(direction)
            .mul(light.outputScale)
            .mul(vec3(1).sub(transmittance));
          const color = mix(above.rgb, direct.add(scattered), submerged)
            .mul(whiteBalance)
            .mul(exp2(exposure));
          result.assign(vec4(color, 1));
        });

        return result;
      })();
    },
  };
}
