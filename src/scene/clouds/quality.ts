export const CLOUDS_QUALITY_PRESETS = [
  "low",
  "medium",
  "high",
  "ultra",
] as const;

export type CloudsQualityPreset = (typeof CLOUDS_QUALITY_PRESETS)[number];

export interface CloudsQuality {
  resolutionScale: number;
  lightShafts: boolean;
  shapeDetail: boolean;
  turbulence: boolean;
  haze: boolean;
  clouds: {
    multiScatteringOctaves: number;
    accurateSunSkyLight: boolean;
    accuratePhaseFunction: boolean;
    maxIterationCount: number;
    minStepSize: number;
    maxStepSize: number;
    maxRayDistance: number;
    perspectiveStepScale: number;
    minDensity: number;
    minExtinction: number;
    minTransmittance: number;
    maxIterationCountToGround: number;
    maxIterationCountToSun: number;
    minSecondaryStepSize: number;
    secondaryStepScale: number;
    maxShadowLengthIterationCount: number;
    minShadowLengthStepSize: number;
    maxShadowLengthRayDistance: number;
  };
  shadow: {
    cascadeCount: number;
    mapSize: number;
    maxIterationCount: number;
    minStepSize: number;
    maxStepSize: number;
    minDensity: number;
    minExtinction: number;
    minTransmittance: number;
  };
}

const HIGH: CloudsQuality = {
  resolutionScale: 1,
  lightShafts: true,
  shapeDetail: true,
  turbulence: true,
  haze: true,
  clouds: {
    multiScatteringOctaves: 8,
    accurateSunSkyLight: true,
    accuratePhaseFunction: false,
    maxIterationCount: 500,
    minStepSize: 50,
    maxStepSize: 1000,
    maxRayDistance: 2e5,
    perspectiveStepScale: 1.01,
    minDensity: 1e-5,
    minExtinction: 1e-5,
    minTransmittance: 1e-2,
    maxIterationCountToGround: 3,
    maxIterationCountToSun: 2,
    minSecondaryStepSize: 100,
    secondaryStepScale: 2,
    maxShadowLengthIterationCount: 500,
    minShadowLengthStepSize: 50,
    maxShadowLengthRayDistance: 2e5,
  },
  shadow: {
    cascadeCount: 3,
    mapSize: 512,
    maxIterationCount: 50,
    minStepSize: 100,
    maxStepSize: 1000,
    minDensity: 1e-5,
    minExtinction: 1e-5,
    minTransmittance: 1e-4,
  },
};

export const cloudsQualityPresets = {
  low: {
    ...HIGH,
    lightShafts: false,
    shapeDetail: false,
    turbulence: false,
    clouds: {
      ...HIGH.clouds,
      accurateSunSkyLight: false,
      maxIterationCount: 200,
      minStepSize: 100,
      maxRayDistance: 1e5,
      minDensity: 1e-4,
      minExtinction: 1e-4,
      minTransmittance: 1e-1,
      maxIterationCountToGround: 0,
      maxIterationCountToSun: 1,
    },
    shadow: {
      ...HIGH.shadow,
      maxIterationCount: 25,
      minDensity: 1e-4,
      minExtinction: 1e-4,
      minTransmittance: 1e-2,
      cascadeCount: 2,
      mapSize: 256,
    },
  },
  medium: {
    ...HIGH,
    lightShafts: false,
    turbulence: false,
    clouds: {
      ...HIGH.clouds,
      minDensity: 1e-4,
      minExtinction: 1e-4,
      accurateSunSkyLight: false,
      maxIterationCountToSun: 2,
      maxIterationCountToGround: 1,
    },
    shadow: {
      ...HIGH.shadow,
      minDensity: 1e-4,
      minExtinction: 1e-4,
      mapSize: 256,
    },
  },
  high: HIGH,
  ultra: {
    ...HIGH,
    clouds: { ...HIGH.clouds, minStepSize: 10 },
    shadow: { ...HIGH.shadow, mapSize: 1024 },
  },
} satisfies Record<CloudsQualityPreset, CloudsQuality>;
