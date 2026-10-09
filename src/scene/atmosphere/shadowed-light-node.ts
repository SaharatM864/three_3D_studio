import { mix, positionWorld, uniform, vec4 } from "three/tsl";
import type { Node, NodeBuilder, NodeFrame } from "three/webgpu";

import { AtmosphereLightNode, getAtmosphereContext } from "./takram";

export interface SunTransmittanceSource {
  sunTransmittance(
    positionECEF: Node<"vec3">,
    builder: NodeBuilder
  ): Node<"float">;
}

export interface WaterLightSource {
  waterLight(positionWorld: Node<"vec3">, builder: NodeBuilder): Node<"float">;
}

export const SUN_TRANSMITTANCE_CONTEXT_KEY = "getSunTransmittance";

export const WATER_LIGHT_CONTEXT_KEY = "getWaterLight";

export class ShadowedAtmosphereLightNode extends AtmosphereLightNode {
  private readonly sunWeight = uniform(1);

  override update(frame: NodeFrame): boolean | undefined {
    const result = super.update(frame);
    this.sunWeight.value = this.light?.body === "sun" ? 1 : 0;
    return result;
  }

  override setupDirect(builder: NodeBuilder) {
    const data = super.setupDirect(builder);
    if (data === undefined) return data;
    const source = getContextSource<SunTransmittanceSource>(
      builder,
      SUN_TRANSMITTANCE_CONTEXT_KEY
    );
    const water = getContextSource<WaterLightSource>(
      builder,
      WATER_LIGHT_CONTEXT_KEY
    );
    if (source === null && water === null) return data;

    let lightColor = data.lightColor as Node<"vec3">;
    if (source !== null) {
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
      lightColor = lightColor.mul(mix(1, transmittance, this.sunWeight));
    }
    if (water !== null) {
      lightColor = lightColor.mul(water.waterLight(positionWorld, builder));
    }
    return { ...data, lightColor };
  }
}

function getContextSource<T>(builder: NodeBuilder, key: string): T | null {
  const getSource = builder.getContext()[key];
  return typeof getSource === "function" ? (getSource() as T | null) : null;
}
