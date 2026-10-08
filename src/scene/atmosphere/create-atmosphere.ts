import { Vector3, type Camera } from "three";
import { context } from "three/tsl";
import type { WebGPURenderer } from "three/webgpu";

import type { GeoLocation } from "@/model/types";

import type { Disposable } from "../use-disposable";
import { geoToECEF, localFrameToECEF } from "./geo-frame";
import {
  AtmosphereContext,
  AtmosphereLight,
  AtmosphereLightNode,
  getECIToECEFRotationMatrix,
  getMoonDirectionECI,
  getSunDirectionECI,
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
  const originECEF = new Vector3();

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
      geoToECEF(location, originECEF);
      localFrameToECEF(originECEF, atmosphere.matrixWorldToECEF.value);

      const matrixECIToECEF = getECIToECEFRotationMatrix(
        epochMs,
        atmosphere.matrixECIToECEF.value
      );
      getSunDirectionECI(
        epochMs,
        atmosphere.sunDirectionECEF.value,
        originECEF
      ).applyMatrix4(matrixECIToECEF);
      getMoonDirectionECI(
        epochMs,
        atmosphere.moonDirectionECEF.value,
        originECEF
      ).applyMatrix4(matrixECIToECEF);
    },

    dispose() {
      atmosphere.dispose();
    },
  };
}
