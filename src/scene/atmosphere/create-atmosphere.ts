import { Vector3, type Camera } from "three";
import { context } from "three/tsl";
import type { WebGPURenderer } from "three/webgpu";

import type { GeoLocation } from "@/model/types";

import type { Disposable } from "../use-disposable";
import {
  AtmosphereContext,
  AtmosphereLight,
  AtmosphereLightNode,
  Ellipsoid,
  Geodetic,
  getECIToECEFRotationMatrix,
  getMoonDirectionECI,
  getSunDirectionECI,
  radians,
} from "./takram";

export interface AtmosphereHandle extends Disposable {
  provide(renderer: WebGPURenderer): () => void;
  setCamera(camera: Camera): void;
  setLocation(location: GeoLocation): void;
  setDate(epochMs: number): void;
}

export function registerAtmosphere(renderer: WebGPURenderer): void {
  renderer.library.addLight(AtmosphereLightNode, AtmosphereLight);
}

export function createAtmosphere(): AtmosphereHandle {
  const atmosphere = new AtmosphereContext();
  const geodetic = new Geodetic();
  const positionECEF = new Vector3();

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

    setLocation({ latitude, longitude, height = 0 }) {
      geodetic
        .set(radians(longitude), radians(latitude), height)
        .toECEF(positionECEF);
      Ellipsoid.WGS84.getNorthUpEastFrame(
        positionECEF,
        atmosphere.matrixWorldToECEF.value
      );
    },

    setDate(epochMs) {
      const matrixECIToECEF = getECIToECEFRotationMatrix(
        epochMs,
        atmosphere.matrixECIToECEF.value
      );
      getSunDirectionECI(
        epochMs,
        atmosphere.sunDirectionECEF.value
      ).applyMatrix4(matrixECIToECEF);
      getMoonDirectionECI(
        epochMs,
        atmosphere.moonDirectionECEF.value
      ).applyMatrix4(matrixECIToECEF);
    },

    dispose() {
      atmosphere.dispose();
    },
  };
}
