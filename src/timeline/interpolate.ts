import type { ColorValue, Vec3 } from "@/model/types";

export type Lerp<T> = (from: T, to: T, t: number) => T;

export const lerpNumber: Lerp<number> = (from, to, t) => from + (to - from) * t;

export const lerpVec3: Lerp<Vec3> = (from, to, t) => [
  lerpNumber(from[0], to[0], t),
  lerpNumber(from[1], to[1], t),
  lerpNumber(from[2], to[2], t),
];

export const lerpColor: Lerp<ColorValue> = (from, to, t) => {
  const a = parseHex(from);
  const b = parseHex(to);
  return `#${a
    .map((channel, i) =>
      Math.round(lerpNumber(channel, b[i], t))
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
};

function parseHex(color: ColorValue): Vec3 {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color);
  if (!match) throw new Error(`Expected a hex color, got "${color}"`);
  const hex =
    match[1].length === 3
      ? [...match[1]].map((digit) => digit + digit).join("")
      : match[1];
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}
