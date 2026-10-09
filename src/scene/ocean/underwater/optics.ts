import type { OceanUnderwater, Vec3 } from "@/model/types";

import { BACKSCATTER_RATIO, DOWNWELLING_SCALE } from "./constants";

export interface WaterOptics {
  extinction: Vec3;
  downwelling: Vec3;
  albedo: Vec3;
}

function perChannel(fn: (channel: 0 | 1 | 2) => number): Vec3 {
  return [fn(0), fn(1), fn(2)];
}

export function resolveWaterOptics({
  absorption,
  scattering,
}: Pick<OceanUnderwater, "absorption" | "scattering">): WaterOptics {
  const extinction = perChannel((i) => absorption[i] + scattering[i]);
  return {
    extinction,
    downwelling: perChannel(
      (i) =>
        DOWNWELLING_SCALE * (absorption[i] + BACKSCATTER_RATIO * scattering[i])
    ),
    albedo: perChannel((i) => scattering[i] / extinction[i]),
  };
}
