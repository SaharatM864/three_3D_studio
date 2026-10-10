import type { Vector3 } from "three";
import {
  attributeArray,
  float,
  Fn,
  max,
  storage,
  texture,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import type { ComputeNode, Node, Texture, UniformNode } from "three/webgpu";

import type { Disposable } from "../../use-disposable";
import type { OceanCascadeMaps } from "../simulation/ocean-simulation";
import { amplitudeEnvelope } from "../surface/waves";
import { PROBE_JACOBIAN_MIN } from "./constants";

export interface WaterProbe extends Disposable {
  readonly compute: ComputeNode;
  readonly height: Node<"float">;
  readonly slope: Node<"vec2">;
}

export function createWaterProbe(
  cascades: readonly OceanCascadeMaps[],
  detail: Texture,
  cameraPosition: UniformNode<"vec3", Vector3>
): WaterProbe {
  const buffer = attributeArray(1, "vec4");

  const displacementAt = (xz: Node<"vec2">): Node<"vec3"> => {
    const envelope = amplitudeEnvelope(detail, xz).toVar();
    const sum = vec3(0).toVar();
    cascades.forEach((cascade, index) => {
      const sample = texture(
        cascade.displacement,
        xz.div(cascade.lengthScale),
        0
      ).xyz;
      sum.addAssign(index <= 1 ? sample.mul(envelope) : sample);
    });
    return sum;
  };

  const compute = Fn(() => {
    const cameraXZ = vec2(cameraPosition.x, cameraPosition.z).toVar();
    const origin = cameraXZ.sub(displacementAt(cameraXZ).xz).toVar();
    const height = displacementAt(origin).y.toVar();
    const envelope = amplitudeEnvelope(detail, origin).toVar();
    const slopes = vec4(0).toVar();
    cascades.forEach((cascade, index) => {
      const sample = texture(
        cascade.derivatives,
        origin.div(cascade.lengthScale),
        0
      );
      slopes.addAssign(index <= 1 ? sample.mul(envelope) : sample);
    });
    buffer
      .element(0)
      .assign(
        vec4(
          height,
          slopes.x.div(max(float(1).add(slopes.z), PROBE_JACOBIAN_MIN)),
          slopes.y.div(max(float(1).add(slopes.w), PROBE_JACOBIAN_MIN)),
          0
        )
      );
  })().compute(1);

  const value = storage(buffer.value, "vec4", 1).toReadOnly().element(0);

  return {
    compute,
    height: value.x,
    slope: value.yz,

    dispose() {
      compute.dispose();
    },
  };
}
