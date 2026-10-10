import { useLayoutEffect, useMemo, type ReactNode } from "react";
import {
  BoxGeometry,
  CylinderGeometry,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  type BufferGeometry,
} from "three";

import type {
  BuoyancySpec,
  PrimitiveShape,
  SceneObjectSpec,
  Vec3,
} from "@/model/types";
import { primitiveHullShape, resolveBuoyancy } from "@/presets/buoyancy";
import type { EvaluatedObject, EvaluatedTransform } from "@/timeline/types";

import { FloatingObject } from "../buoyancy/floating-object";
import type { SceneComponents } from "../custom-components";
import { createMaterial } from "../materials/create-material";
import { applyMaterialValues } from "../materials/material-parameters";
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
  const { position, rotation, scale } = values.transform;
  const mesh = <PrimitiveMesh spec={spec} values={values} />;
  if (spec.buoyancy === undefined) {
    return (
      <group position={position} rotation={rotation} scale={scale}>
        {mesh}
      </group>
    );
  }
  return (
    <FloatingPrimitive
      spec={spec}
      buoyancy={spec.buoyancy}
      transform={values.transform}
    >
      {mesh}
    </FloatingPrimitive>
  );
}

function FloatingPrimitive({
  spec,
  buoyancy,
  transform,
  children,
}: {
  spec: PrimitiveSpec;
  buoyancy: BuoyancySpec;
  transform: EvaluatedTransform;
  children: ReactNode;
}) {
  const [px, py, pz] = transform.position;
  const [rx, ry, rz] = transform.rotation;
  const [sx, sy, sz] = transform.scale;
  const [width, height, depth] = spec.size ?? UNIT_SIZE;
  const resolved = useMemo(
    () =>
      resolveBuoyancy(buoyancy, {
        shape: primitiveHullShape(spec.shape),
        size: [width * sx, height * sy, depth * sz],
      }),
    [buoyancy, spec.shape, width, height, depth, sx, sy, sz]
  );
  const position = useMemo<Vec3>(() => [px, py, pz], [px, py, pz]);
  const rotation = useMemo<Vec3>(() => [rx, ry, rz], [rx, ry, rz]);

  return (
    <FloatingObject
      id={spec.id}
      buoyancy={resolved}
      position={position}
      rotation={rotation}
    >
      <group scale={transform.scale}>{children}</group>
    </FloatingObject>
  );
}

function PrimitiveMesh({
  spec,
  values,
}: {
  spec: PrimitiveSpec;
  values: EvaluatedObject;
}) {
  const { color, metalness, roughness, emissiveIntensity, opacity } =
    values.material ?? {};
  const material = useMemo(
    () => createMaterial(spec.material, undefined),
    [spec.material]
  );
  useDisposable(material);

  useLayoutEffect(() => {
    applyMaterialValues(material, spec.material, {
      color,
      metalness,
      roughness,
      emissiveIntensity,
      opacity,
    });
  }, [
    material,
    spec.material,
    color,
    metalness,
    roughness,
    emissiveIntensity,
    opacity,
  ]);

  return (
    <mesh
      geometry={unitGeometries[spec.shape]}
      material={material}
      scale={spec.size ?? UNIT_SIZE}
      castShadow={spec.castShadow}
      receiveShadow={spec.receiveShadow}
    />
  );
}
