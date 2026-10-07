import type { MeshStandardMaterial } from "three";

import { notImplemented } from "@/lib/not-implemented";
import type { MaterialSpec } from "@/model/types";

/**
 * Build a material from a spec merged over its preset. Animated fields use
 * their first value here; per-frame values come from the render bridge.
 */
export type CreateMaterial = (
  spec: MaterialSpec | undefined
) => MeshStandardMaterial;

// TODO(M1): color/metalness/roughness/emissive. TODO(M4): texture maps.
export const createMaterial: CreateMaterial = () =>
  notImplemented("scene/createMaterial");
