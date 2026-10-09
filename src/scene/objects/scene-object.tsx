import { useMemo } from "react";
import {
  BoxGeometry,
  CylinderGeometry,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  type BufferGeometry,
} from "three";

import type { PrimitiveShape, SceneObjectSpec, Vec3 } from "@/model/types";
import type { EvaluatedObject } from "@/timeline/types";

import type { SceneComponents } from "../custom-components";
import { createMaterial } from "../materials/create-material";
import { useDisposable } from "../use-disposable";

export interface SceneObjectProps {
  spec: SceneObjectSpec;
  values: EvaluatedObject;
  components?: SceneComponents;
}

type PrimitiveSpec = Extract<SceneObjectSpec, { kind: "primitive" }>;

const UNIT_SIZE: Vec3 = [1, 1, 1];

const unitGeometries: Record<PrimitiveShape, BufferGeometry> = {
  box: new BoxGeometry(1, 1, 1),
  sphere: new SphereGeometry(0.5, 64, 32),
  plane: new PlaneGeometry(1, 1),
  cylinder: new CylinderGeometry(0.5, 0.5, 1, 64),
  torus: new TorusGeometry(0.35, 0.15, 32, 96),
};

// TODO(M4): "model" (useGLTF + AnimationMixer.setTime), "text" (font loaded first).
// TODO(M2): "custom" (components[componentKey]).
export function SceneObject({ spec, values }: SceneObjectProps) {
  if (spec.kind !== "primitive") return null;
  return <Primitive spec={spec} values={values} />;
}

function Primitive({
  spec,
  values,
}: {
  spec: PrimitiveSpec;
  values: EvaluatedObject;
}) {
  const { color, metalness, roughness, emissiveIntensity, opacity } =
    values.material ?? {};
  const material = useMemo(
    () =>
      createMaterial(spec.material, {
        color,
        metalness,
        roughness,
        emissiveIntensity,
        opacity,
      }),
    [spec.material, color, metalness, roughness, emissiveIntensity, opacity]
  );
  useDisposable(material);

  const { position, rotation, scale } = values.transform;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh
        geometry={unitGeometries[spec.shape]}
        material={material}
        scale={spec.size ?? UNIT_SIZE}
        castShadow={spec.castShadow}
        receiveShadow={spec.receiveShadow}
      />
    </group>
  );
}
