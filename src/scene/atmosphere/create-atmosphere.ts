import type { Camera } from "three";
import { context } from "three/tsl";
import type { WebGPURenderer } from "three/webgpu";

import { ATMOSPHERE_RAYMARCH_SCATTERING } from "../render-config";
import type { Disposable } from "../use-disposable";
import type { CelestialFrame } from "./geo-frame";
import {
  ShadowedAtmosphereLightNode,
  SUN_TRANSMITTANCE_CONTEXT_KEY,
  WATER_LIGHT_CONTEXT_KEY,
  type SunTransmittanceSource,
  type WaterLightSource,
} from "./shadowed-light-node";
import {
  AtmosphereContext,
  AtmosphereLight,
  onLUTUpdate,
  whenLUTComputed,
} from "./takram";

export interface AtmosphereHandle extends Disposable {
  readonly lutReady: Promise<void>;
  provide(renderer: WebGPURenderer): () => void;
  setCamera(camera: Camera): void;
  setCelestialFrame(frame: CelestialFrame): void;
  setSunTransmittance(source: SunTransmittanceSource | null): void;
  setWaterLight(source: WaterLightSource | null): void;
  onLUTUpdate(listener: () => void): () => void;
}

interface ProvidedContext {
  renderer: WebGPURenderer;
  base: WebGPURenderer["contextNode"];
}

export function registerAtmosphere(renderer: WebGPURenderer): void {
  renderer.library.addLight(ShadowedAtmosphereLightNode, AtmosphereLight);
}

export function createAtmosphere(): AtmosphereHandle {
  const atmosphere = new AtmosphereContext();
  atmosphere.raymarchScattering = ATMOSPHERE_RAYMARCH_SCATTERING;
  const lutReady = whenLUTComputed(atmosphere);
  let sunTransmittance: SunTransmittanceSource | null = null;
  let waterLight: WaterLightSource | null = null;
  let provided: ProvidedContext | null = null;

  function apply(): void {
    if (provided === null) return;
    const source = sunTransmittance;
    const water = waterLight;
    provided.renderer.contextNode = context({
      ...provided.base.value,
      getAtmosphere: () => atmosphere,
      [SUN_TRANSMITTANCE_CONTEXT_KEY]: () => source,
      [WATER_LIGHT_CONTEXT_KEY]: () => water,
    });
  }

  return {
    lutReady,

    provide(renderer) {
      const base = renderer.contextNode;
      provided = { renderer, base };
      apply();
      return () => {
        if (provided?.renderer === renderer) provided = null;
        renderer.contextNode = base;
      };
    },

    setCamera(camera) {
      atmosphere.camera = camera;
    },

    setCelestialFrame(frame) {
      atmosphere.matrixWorldToECEF.value.copy(frame.worldToECEF);
      atmosphere.matrixECIToECEF.value.copy(frame.eciToECEF);
      atmosphere.sunDirectionECEF.value.copy(frame.sunDirectionECEF);
      atmosphere.moonDirectionECEF.value.copy(frame.moonDirectionECEF);
    },

    setSunTransmittance(source) {
      if (source === sunTransmittance) return;
      sunTransmittance = source;
      apply();
    },

    setWaterLight(source) {
      if (source === waterLight) return;
      waterLight = source;
      apply();
    },

    onLUTUpdate(listener) {
      return onLUTUpdate(atmosphere, listener);
    },

    dispose() {
      atmosphere.dispose();
    },
  };
}
