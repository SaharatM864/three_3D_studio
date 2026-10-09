import { MathUtils } from "three";

import type { CelestialFrame } from "./geo-frame";

export interface NightSky {
  active: boolean;
  starsIntensity: number;
}

const NIGHT_SUN_ALTITUDE = MathUtils.degToRad(-1);
const DARK_SUN_ALTITUDE = MathUtils.degToRad(-12);
const STARS_INTENSITY = 1000;
const MOON_LIGHT_GAIN = 2500;
const MIN_MOON_ILLUMINATION = 0.02;

export function isNight(frame: CelestialFrame): boolean {
  return frame.sunAltitude < NIGHT_SUN_ALTITUDE;
}

export function nightSky(frame: CelestialFrame): NightSky {
  const darkness = MathUtils.smoothstep(
    -frame.sunAltitude,
    -NIGHT_SUN_ALTITUDE,
    -DARK_SUN_ALTITUDE
  );
  return {
    active: isNight(frame),
    starsIntensity: STARS_INTENSITY * darkness,
  };
}

export function moonLightGain(frame: CelestialFrame): number {
  return (
    MOON_LIGHT_GAIN * Math.max(frame.moonIllumination, MIN_MOON_ILLUMINATION)
  );
}
