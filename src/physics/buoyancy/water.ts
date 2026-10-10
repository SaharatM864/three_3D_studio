export interface WaterSample {
  height: number;
  verticalVelocity: number;
}

export interface WaterSurface {
  sample(x: number, z: number, out: WaterSample): void;
}

export interface WaterSource {
  setTime(time: number): void;
  surface(id: string): WaterSurface | null;
}

export function createWaterSample(): WaterSample {
  return { height: 0, verticalVelocity: 0 };
}

export function createFlatWater(level = 0): WaterSource & WaterSurface {
  const water: WaterSource & WaterSurface = {
    setTime() {},
    surface: () => water,
    sample(_x, _z, out) {
      out.height = level;
      out.verticalVelocity = 0;
    },
  };
  return water;
}
