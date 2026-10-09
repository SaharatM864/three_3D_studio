import type { Material, MeshStandardMaterialParameters } from "three";

import type { MaterialSpec } from "@/model/types";
import { resolveMaterial } from "@/presets/materials";
import type { EvaluatedMaterial } from "@/timeline/types";

export type CreateMaterial = (
  spec: MaterialSpec | undefined,
  values: EvaluatedMaterial | undefined
) => Material;

// TODO(M4): texture maps from spec.maps.
export function materialParameters(
  spec: MaterialSpec | undefined,
  values: EvaluatedMaterial = {}
): MeshStandardMaterialParameters {
  const { emissive } = resolveMaterial(spec);
  const opacity = values.opacity ?? 1;

  return {
    color: values.color ?? "#ffffff",
    metalness: values.metalness ?? 0,
    roughness: values.roughness ?? 1,
    emissive: emissive ?? "#000000",
    emissiveIntensity: values.emissiveIntensity ?? 1,
    opacity,
    transparent: opacity < 1,
  };
}

export function applyMaterialValues(
  material: Material,
  spec: MaterialSpec | undefined,
  values: EvaluatedMaterial | undefined
): void {
  const parameters = materialParameters(spec, values);
  if (material.transparent !== parameters.transparent) {
    material.needsUpdate = true;
  }
  material.setValues(parameters);
}
