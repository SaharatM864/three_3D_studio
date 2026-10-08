import type {
  CloudChannel,
  CloudDensityProfile,
  CloudHaze,
  CloudLayerSpec,
  CloudScattering,
  CloudsSpec,
  CloudTextureTransform,
  CloudTurbulence,
  Vec2,
  Vec3,
} from "@/model/types";

export type ResolvedCloudLayer = Required<
  Omit<CloudLayerSpec, "densityProfile">
> & {
  densityProfile: CloudDensityProfile;
};

export interface ResolvedClouds {
  coverage: number;
  layers: readonly ResolvedCloudLayer[];
  localWeather: CloudTextureTransform<Vec2>;
  shape: CloudTextureTransform<Vec3>;
  shapeDetail: CloudTextureTransform<Vec3>;
  turbulence: CloudTurbulence;
  scattering: CloudScattering;
  haze: CloudHaze;
}

export const MAX_CLOUD_LAYERS = 4;

export const CLOUD_CHANNELS: readonly CloudChannel[] = ["r", "g", "b", "a"];

export const DEFAULT_CLOUD_LAYER: Omit<
  ResolvedCloudLayer,
  "channel" | "altitude" | "height"
> = {
  densityScale: 0.2,
  shapeAmount: 1,
  shapeDetailAmount: 1,
  weatherExponent: 1,
  shapeAlteringBias: 0.35,
  coverageFilterWidth: 0.6,
  densityProfile: {
    expTerm: 0,
    exponent: 0,
    linearTerm: 0.75,
    constantTerm: 0.25,
  },
  shadow: false,
};

export const DEFAULT_CLOUD_LAYERS: readonly ResolvedCloudLayer[] = [
  {
    ...DEFAULT_CLOUD_LAYER,
    channel: "r",
    altitude: 750,
    height: 650,
    shadow: true,
  },
  {
    ...DEFAULT_CLOUD_LAYER,
    channel: "g",
    altitude: 1000,
    height: 1200,
    shadow: true,
  },
  {
    ...DEFAULT_CLOUD_LAYER,
    channel: "b",
    altitude: 7500,
    height: 500,
    densityScale: 0.003,
    shapeAmount: 0.4,
    shapeDetailAmount: 0,
    coverageFilterWidth: 0.5,
  },
];

export const DEFAULT_CLOUDS: ResolvedClouds = {
  coverage: 0.3,
  layers: DEFAULT_CLOUD_LAYERS,
  localWeather: { repeat: [100, 100], offset: [0, 0], velocity: [0, 0] },
  shape: {
    repeat: [0.0003, 0.0003, 0.0003],
    offset: [0, 0, 0],
    velocity: [0, 0, 0],
  },
  shapeDetail: {
    repeat: [0.006, 0.006, 0.006],
    offset: [0, 0, 0],
    velocity: [0, 0, 0],
  },
  turbulence: { repeat: [20, 20], displacement: 350 },
  scattering: {
    scatteringCoefficient: 1,
    absorptionCoefficient: 0,
    scatterAnisotropy1: 0.7,
    scatterAnisotropy2: -0.2,
    scatterAnisotropyMix: 0.5,
    skyLightScale: 1,
    groundBounceScale: 1,
    powderScale: 0.8,
    powderExponent: 150,
  },
  haze: {
    densityScale: 3e-5,
    exponent: 1e-3,
    scatteringCoefficient: 0.9,
    absorptionCoefficient: 0.5,
  },
};

export function resolveClouds(spec: CloudsSpec): ResolvedClouds {
  const clouds: ResolvedClouds = {
    coverage: spec.coverage ?? DEFAULT_CLOUDS.coverage,
    layers: spec.layers?.map(resolveCloudLayer) ?? DEFAULT_CLOUDS.layers,
    localWeather: { ...DEFAULT_CLOUDS.localWeather, ...spec.localWeather },
    shape: { ...DEFAULT_CLOUDS.shape, ...spec.shape },
    shapeDetail: { ...DEFAULT_CLOUDS.shapeDetail, ...spec.shapeDetail },
    turbulence: { ...DEFAULT_CLOUDS.turbulence, ...spec.turbulence },
    scattering: { ...DEFAULT_CLOUDS.scattering, ...spec.scattering },
    haze: { ...DEFAULT_CLOUDS.haze, ...spec.haze },
  };
  validateClouds(clouds);
  return clouds;
}

function resolveCloudLayer(layer: CloudLayerSpec): ResolvedCloudLayer {
  return {
    ...DEFAULT_CLOUD_LAYER,
    ...layer,
    densityProfile: {
      ...DEFAULT_CLOUD_LAYER.densityProfile,
      ...layer.densityProfile,
    },
  };
}

type Bounds = readonly [min: number, max: number, inclusive?: boolean];

const ANY: Bounds = [-Infinity, Infinity];
const NON_NEGATIVE: Bounds = [0, Infinity];
const UNIT: Bounds = [0, 1];
const ANISOTROPY: Bounds = [-1, 1, false];

type NumericLayerKey = Exclude<
  keyof ResolvedCloudLayer,
  "channel" | "densityProfile" | "shadow"
>;

const LAYER_BOUNDS: Record<NumericLayerKey, Bounds> = {
  altitude: ANY,
  height: NON_NEGATIVE,
  densityScale: NON_NEGATIVE,
  shapeAmount: NON_NEGATIVE,
  shapeDetailAmount: NON_NEGATIVE,
  weatherExponent: NON_NEGATIVE,
  shapeAlteringBias: ANY,
  coverageFilterWidth: UNIT,
};

const DENSITY_PROFILE_BOUNDS: Record<keyof CloudDensityProfile, Bounds> = {
  expTerm: ANY,
  exponent: ANY,
  linearTerm: ANY,
  constantTerm: ANY,
};

const SCATTERING_BOUNDS: Record<keyof CloudScattering, Bounds> = {
  scatteringCoefficient: NON_NEGATIVE,
  absorptionCoefficient: NON_NEGATIVE,
  scatterAnisotropy1: ANISOTROPY,
  scatterAnisotropy2: ANISOTROPY,
  scatterAnisotropyMix: UNIT,
  skyLightScale: NON_NEGATIVE,
  groundBounceScale: NON_NEGATIVE,
  powderScale: NON_NEGATIVE,
  powderExponent: NON_NEGATIVE,
};

const HAZE_BOUNDS: Record<keyof CloudHaze, Bounds> = {
  densityScale: NON_NEGATIVE,
  exponent: NON_NEGATIVE,
  scatteringCoefficient: NON_NEGATIVE,
  absorptionCoefficient: NON_NEGATIVE,
};

function validateClouds(clouds: ResolvedClouds): void {
  assertInRange("clouds.coverage", clouds.coverage, UNIT);
  if (clouds.layers.length > MAX_CLOUD_LAYERS) {
    throw new Error(
      `Invalid clouds.layers: at most ${MAX_CLOUD_LAYERS} layers, got ${clouds.layers.length}`
    );
  }
  clouds.layers.forEach((layer, index) =>
    validateCloudLayer(`clouds.layers[${index}]`, layer)
  );
  assertTransform("clouds.localWeather", clouds.localWeather, 2);
  assertTransform("clouds.shape", clouds.shape, 3);
  assertTransform("clouds.shapeDetail", clouds.shapeDetail, 3);
  assertVector("clouds.turbulence.repeat", clouds.turbulence.repeat, 2);
  assertInRange(
    "clouds.turbulence.displacement",
    clouds.turbulence.displacement,
    NON_NEGATIVE
  );
  assertFields("clouds.scattering", clouds.scattering, SCATTERING_BOUNDS);
  assertFields("clouds.haze", clouds.haze, HAZE_BOUNDS);
}

function validateCloudLayer(name: string, layer: ResolvedCloudLayer): void {
  if (!CLOUD_CHANNELS.includes(layer.channel)) {
    throw new Error(
      `Invalid ${name}.channel "${layer.channel}": use one of ${CLOUD_CHANNELS.join(", ")}`
    );
  }
  if (typeof layer.shadow !== "boolean") {
    throw new Error(`Invalid ${name}.shadow: expected a boolean`);
  }
  assertFields<NumericLayerKey>(name, layer, LAYER_BOUNDS);
  assertFields(
    `${name}.densityProfile`,
    layer.densityProfile,
    DENSITY_PROFILE_BOUNDS
  );
}

function assertTransform(
  name: string,
  transform: CloudTextureTransform<readonly number[]>,
  length: number
): void {
  assertVector(`${name}.repeat`, transform.repeat, length);
  assertVector(`${name}.offset`, transform.offset, length);
  assertVector(`${name}.velocity`, transform.velocity, length);
}

function assertVector(
  name: string,
  vector: readonly number[],
  length: number
): void {
  if (!Array.isArray(vector) || vector.length !== length) {
    throw new Error(`Invalid ${name}: expected ${length} numbers`);
  }
  vector.forEach((value, index) =>
    assertInRange(`${name}[${index}]`, value, ANY)
  );
}

function assertFields<K extends string>(
  name: string,
  values: Readonly<Record<K, number>>,
  bounds: Readonly<Record<K, Bounds>>
): void {
  for (const key of Object.keys(bounds) as K[]) {
    assertInRange(`${name}.${key}`, values[key], bounds[key]);
  }
}

function assertInRange(
  name: string,
  value: number,
  [min, max, inclusive = true]: Bounds
): void {
  const inRange = inclusive
    ? value >= min && value <= max
    : value > min && value < max;
  if (!Number.isFinite(value) || !inRange) {
    const interval = inclusive ? `[${min}, ${max}]` : `(${min}, ${max})`;
    throw new Error(
      `Invalid ${name} ${value}: expected a finite number in ${interval}`
    );
  }
}
