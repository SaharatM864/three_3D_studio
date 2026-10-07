import type { MeshStandardMaterial } from "three";

import { notImplemented } from "@/lib/not-implemented";
import type { MaterialSpec } from "@/model/types";

export type CreateMaterial = (
  spec: MaterialSpec | undefined
) => MeshStandardMaterial;

// TODO(M1): color/metalness/roughness/emissive. TODO(M4): texture maps.
export const createMaterial: CreateMaterial = () =>
  notImplemented("scene/createMaterial");
