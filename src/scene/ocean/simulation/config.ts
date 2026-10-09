import type { ResolvedOcean } from "@/presets/ocean";

export const OCEAN_FFT_SIZE = 256;

export const OCEAN_LENGTH_SCALES = [1024, 144, 24] as const;

export const OCEAN_BOUNDARY_FACTOR = 6;

export interface WaveSystemParameters {
  scale: number;
  windSpeed: number;
  windDirection: number;
  fetch: number;
  spreadBlend: number;
  swell: number;
  peakEnhancement: number;
  shortWavesFade: number;
  tailFalloff: number;
  tailFloor: number;
}

export interface SwellParameters extends WaveSystemParameters {
  windCoupling: number;
}

export interface SimulationParameters {
  g: number;
  depth: number;
  lambda: number;
  chopFalloff: number;
  chopFloor: number;
  chopLean: number;
  local: WaveSystemParameters;
  swell: SwellParameters;
  foamDecay: number;
  foamSpread: number;
  seed: number;
}

const PHYSICS = {
  g: 9.81,
  depth: 500,
  chopFalloff: 0.28,
  chopFloor: 0.2,
  chopLean: 0.62,
};

const LOCAL_SHAPE = {
  spreadBlend: 0.78,
  swell: 0.42,
  peakEnhancement: 5,
  shortWavesFade: 0.07,
  tailFalloff: 0.95,
  tailFloor: 0.45,
};

const SWELL_SHAPE = {
  spreadBlend: 0.97,
  swell: 0.88,
  peakEnhancement: 4.5,
  shortWavesFade: 2.5,
  tailFalloff: 1.7,
  tailFloor: 0.15,
  windCoupling: 0.7,
};

export function toSimulationParameters(
  ocean: ResolvedOcean
): SimulationParameters {
  const { wind, swell } = ocean;
  return {
    ...PHYSICS,
    lambda: ocean.choppiness,
    local: {
      ...LOCAL_SHAPE,
      scale: wind.scale,
      windSpeed: wind.speed,
      windDirection: wind.direction,
      fetch: wind.fetch,
    },
    swell: {
      ...SWELL_SHAPE,
      scale: swell.scale,
      windSpeed: swell.speed,
      windDirection: swell.direction,
      fetch: swell.fetch,
    },
    foamDecay: ocean.foam.decay,
    foamSpread: ocean.foam.spread,
    seed: ocean.seed,
  };
}

export function spectrumKey({
  g,
  depth,
  local,
  swell,
  seed,
}: SimulationParameters): string {
  return JSON.stringify([g, depth, local, swell, seed]);
}
