import { MeshStandardNodeMaterial } from "three/webgpu";

import type { MaterialSpec } from "@/model/types";
import { resolveMaterial } from "@/presets/materials";
import type { EvaluatedMaterial } from "@/timeline/types";

export type CreateMaterial = (
  spec: MaterialSpec | undefined,
  values: EvaluatedMaterial | undefined
) => MeshStandardNodeMaterial;

// TODO(M4): texture maps from spec.maps.
export const createMaterial: CreateMaterial = (spec, values = {}) => {
  const { emissive } = resolveMaterial(spec);
  const opacity = values.opacity ?? 1;

  return new MeshStandardNodeMaterial({
    color: values.color ?? "#ffffff",
    metalness: values.metalness ?? 0,
    roughness: values.roughness ?? 1,
    emissive: emissive ?? "#000000",
    emissiveIntensity: values.emissiveIntensity ?? 1,
    opacity,
    transparent: opacity < 1,
  });
};
