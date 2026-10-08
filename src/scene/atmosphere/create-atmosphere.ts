import type { Camera } from "three";
import { context } from "three/tsl";
import type { WebGPURenderer } from "three/webgpu";

import type { GeoLocation } from "@/model/types";

import type { Disposable } from "../use-disposable";
import { computeCelestialFrame } from "./geo-frame";
import {
  AtmosphereContext,
  AtmosphereLight,
  AtmosphereLightNode,
} from "./takram";

export interface AtmosphereEnvironment {
  location: GeoLocation;
  epochMs: number;
}

export interface AtmosphereHandle extends Disposable {
  provide(renderer: WebGPURenderer): () => void;
  setCamera(camera: Camera): void;
  setEnvironment(environment: AtmosphereEnvironment): void;
}

export function registerAtmosphere(renderer: WebGPURenderer): void {
  renderer.library.addLight(AtmosphereLightNode, AtmosphereLight);
}

export function createAtmosphere(): AtmosphereHandle {
  const atmosphere = new AtmosphereContext();

  return {
    provide(renderer) {
      const previous = renderer.contextNode;
      renderer.contextNode = context({
        ...previous.value,
        getAtmosphere: () => atmosphere,
      });
      return () => {
        renderer.contextNode = previous;
      };
    },

    setCamera(camera) {
      atmosphere.camera = camera;
    },

    setEnvironment({ location, epochMs }) {
      computeCelestialFrame(location, epochMs, {
        worldToECEF: atmosphere.matrixWorldToECEF.value,
        eciToECEF: atmosphere.matrixECIToECEF.value,
        sunDirectionECEF: atmosphere.sunDirectionECEF.value,
        moonDirectionECEF: atmosphere.moonDirectionECEF.value,
      });
    },

    dispose() {
      atmosphere.dispose();
    },
  };
}
