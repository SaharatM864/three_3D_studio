import {
  abs,
  exp2,
  floor,
  int,
  max,
  positionGeometry,
  saturate,
} from "three/tsl";
import type { Node } from "three/webgpu";

import { CLIPMAP_MORPH_END, CLIPMAP_MORPH_START } from "./constants";
import type { ClipmapUniforms } from "./uniforms";

export interface ClipmapVertex {
  rest: Node<"vec2">;
  worldXZ: Node<"vec2">;
  spacing: Node<"float">;
}

export function clipmapVertex({
  origin,
  viewer,
  levelOffsets,
  baseSpacing,
  resolution,
}: ClipmapUniforms): ClipmapVertex {
  const lattice = positionGeometry.xy;
  const level = positionGeometry.z;
  const cell = baseSpacing.mul(exp2(level));
  const local = levelOffsets.element(int(level)).add(lattice.mul(cell));
  const reach = abs(local.sub(viewer));
  const morph = saturate(
    max(reach.x, reach.y)
      .div(resolution.mul(cell))
      .sub(CLIPMAP_MORPH_START)
      .div(CLIPMAP_MORPH_END - CLIPMAP_MORPH_START)
  );
  const parity = lattice.sub(floor(lattice.mul(0.5)).mul(2));
  const rest = local.sub(parity.mul(cell.mul(morph)));
  return {
    rest,
    worldXZ: origin.add(rest),
    spacing: cell.mul(morph.add(1)),
  };
}
