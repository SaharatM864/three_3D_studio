import { MathUtils, Matrix4, Vector3 } from "three";

import type { GeoLocation } from "@/model/types";

import {
  Ellipsoid,
  Geodetic,
  getECIToECEFRotationMatrix,
  getMoonDirectionECI,
  getSunDirectionECI,
  radians,
} from "./takram";

export interface CelestialFrame {
  worldToECEF: Matrix4;
  eciToECEF: Matrix4;
  sunDirectionECEF: Vector3;
  moonDirectionECEF: Vector3;
  sunAltitude: number;
  moonIllumination: number;
}

const geodetic = new Geodetic();
const observerECEF = new Vector3();
const upECEF = new Vector3();

export function computeCelestialFrame(
  { latitude, longitude, height = 0 }: GeoLocation,
  epochMs: number
): CelestialFrame {
  geodetic
    .set(radians(longitude), radians(latitude), height)
    .toECEF(observerECEF);
  const worldToECEF = Ellipsoid.WGS84.getNorthUpEastFrame(
    observerECEF,
    new Matrix4()
  );
  const eciToECEF = getECIToECEFRotationMatrix(epochMs, new Matrix4());
  const sunDirectionECEF = getSunDirectionECI(
    epochMs,
    new Vector3(),
    observerECEF
  ).applyMatrix4(eciToECEF);
  const moonDirectionECEF = getMoonDirectionECI(
    epochMs,
    new Vector3(),
    observerECEF
  ).applyMatrix4(eciToECEF);
  upECEF.setFromMatrixColumn(worldToECEF, 1).normalize();

  return {
    worldToECEF,
    eciToECEF,
    sunDirectionECEF,
    moonDirectionECEF,
    sunAltitude: Math.asin(
      MathUtils.clamp(sunDirectionECEF.dot(upECEF), -1, 1)
    ),
    moonIllumination: (1 - sunDirectionECEF.dot(moonDirectionECEF)) / 2,
  };
}
