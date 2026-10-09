export type Bounds = readonly [min: number, max: number, inclusive?: boolean];

export const ANY: Bounds = [-Infinity, Infinity];
export const NON_NEGATIVE: Bounds = [0, Infinity];
export const UNIT: Bounds = [0, 1];

export function assertVector(
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

export function assertFields<K extends string>(
  name: string,
  values: Readonly<Record<K, number>>,
  bounds: Readonly<Record<K, Bounds>>
): void {
  for (const key of Object.keys(bounds) as K[]) {
    assertInRange(`${name}.${key}`, values[key], bounds[key]);
  }
}

export function assertInRange(
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
