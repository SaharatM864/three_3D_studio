import { mix, positionWorld, uniform, vec4 } from "three/tsl";
import type { Node, NodeBuilder, NodeFrame } from "three/webgpu";

import { AtmosphereLightNode, getAtmosphereContext } from "./takram";

export interface SunTransmittanceSource {
  sunTransmittance(
    positionECEF: Node<"vec3">,
    builder: NodeBuilder
  ): Node<"float">;
}

export const SUN_TRANSMITTANCE_CONTEXT_KEY = "getSunTransmittance";

export class ShadowedAtmosphereLightNode extends AtmosphereLightNode {
  private readonly sunWeight = uniform(1);

  override update(frame: NodeFrame): boolean | undefined {
    const result = super.update(frame);
    this.sunWeight.value = this.light?.body === "sun" ? 1 : 0;
    return result;
  }

  override setupDirect(builder: NodeBuilder) {
    const data = super.setupDirect(builder);
    const source = getSunTransmittanceSource(builder);
    if (data === undefined || source === null) return data;

    const atmosphere = getAtmosphereContext(builder);
    const positionECEF = atmosphere.matrixWorldToECEF.mul(
      vec4(positionWorld, 1)
    ).xyz;
    const transmittance = source.sunTransmittance(
      atmosphere.correctAltitude
        ? positionECEF.add(atmosphere.altitudeCorrectionECEF)
        : positionECEF,
      builder
    );
    const lightColor = data.lightColor as Node<"vec3">;
    return {
      ...data,
      lightColor: lightColor.mul(mix(1, transmittance, this.sunWeight)),
    };
  }
}

function getSunTransmittanceSource(
  builder: NodeBuilder
): SunTransmittanceSource | null {
  const getSource = builder.getContext()[SUN_TRANSMITTANCE_CONTEXT_KEY];
  return typeof getSource === "function"
    ? (getSource() as SunTransmittanceSource | null)
    : null;
}
