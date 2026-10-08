import { Vector3, type Matrix4 } from "three";

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
}

const geodetic = new Geodetic();
const observerECEF = new Vector3();

export function geoToECEF(
  { latitude, longitude, height = 0 }: GeoLocation,
  result: Vector3
): Vector3 {
  return geodetic
    .set(radians(longitude), radians(latitude), height)
    .toECEF(result);
}

export function localFrameToECEF(
  originECEF: Vector3,
  result: Matrix4
): Matrix4 {
  return Ellipsoid.WGS84.getNorthUpEastFrame(originECEF, result);
}

export function computeCelestialFrame(
  location: GeoLocation,
  epochMs: number,
  result: CelestialFrame
): CelestialFrame {
  geoToECEF(location, observerECEF);
  localFrameToECEF(observerECEF, result.worldToECEF);
  getECIToECEFRotationMatrix(epochMs, result.eciToECEF);
  getSunDirectionECI(
    epochMs,
    result.sunDirectionECEF,
    observerECEF
  ).applyMatrix4(result.eciToECEF);
  getMoonDirectionECI(
    epochMs,
    result.moonDirectionECEF,
    observerECEF
  ).applyMatrix4(result.eciToECEF);
  return result;
}
