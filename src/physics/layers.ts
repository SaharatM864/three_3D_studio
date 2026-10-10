import type { CollisionLayer } from "@/model/types";

const LAYER_BITS: Readonly<Record<CollisionLayer, number>> = {
  environment: 0,
  prop: 1,
  player: 2,
  trigger: 3,
};

const LAYER_FILTERS: Readonly<
  Record<CollisionLayer, readonly CollisionLayer[]>
> = {
  environment: ["prop", "player"],
  prop: ["environment", "prop", "player", "trigger"],
  player: ["environment", "prop", "trigger"],
  trigger: ["prop", "player"],
};

export function layerMask(layers: readonly CollisionLayer[]): number {
  let mask = 0;
  for (const layer of layers) mask |= 1 << LAYER_BITS[layer];
  return mask;
}

export function collisionGroups(layer: CollisionLayer): number {
  return ((layerMask([layer]) << 16) | layerMask(LAYER_FILTERS[layer])) >>> 0;
}
