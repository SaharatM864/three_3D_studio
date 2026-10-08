import type { Matrix4, Vector3 } from "three";

import type { GeoLocation } from "@/model/types";

import { Ellipsoid, Geodetic, radians } from "./takram";

const geodetic = new Geodetic();

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
