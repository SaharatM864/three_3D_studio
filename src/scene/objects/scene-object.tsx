import { useLayoutEffect, useMemo, type ReactNode } from "react";

import type { SceneObjectSpec, Vec3 } from "@/model/types";
import { primitiveHullShape, resolveBuoyancy } from "@/presets/buoyancy";
import { resolvePhysics } from "@/presets/physics";
import type { EvaluatedObject, EvaluatedTransform } from "@/timeline/types";

import { FloatingObject } from "../buoyancy/floating-object";
import type { SceneComponents } from "../custom-components";
import { createMaterial } from "../materials/create-material";
import { applyMaterialValues } from "../materials/material-parameters";
import { PhysicsObject } from "../physics/physics-object";
import { useDisposable } from "../use-disposable";
import { UNIT_SIZE, unitGeometries } from "./primitive-geometry";

export interface SceneObjectProps {
  spec: SceneObjectSpec;
  values: EvaluatedObject;
  components?: SceneComponents;
}

type PrimitiveSpec = Extract<SceneObjectSpec, { kind: "primitive" }>;

// TODO(M4): "model" (useGLTF + AnimationMixer.setTime), "text" (font loaded first).
// TODO(M2): "custom" (components[componentKey]).
export function SceneObject({ spec, values }: SceneObjectProps) {
  if (spec.kind !== "primitive") return null;
  return (
    <PrimitiveObject spec={spec} transform={values.transform}>
      <PrimitiveMesh spec={spec} values={values} />
    </PrimitiveObject>
  );
}

function PrimitiveObject({
  spec,
  transform,
  children,
}: {
  spec: PrimitiveSpec;
  transform: EvaluatedTransform;
  children: ReactNode;
}) {
  const [px, py, pz] = transform.position;
  const [rx, ry, rz] = transform.rotation;
  const [sx, sy, sz] = transform.scale;
  const [width, height, depth] = spec.size ?? UNIT_SIZE;
  const position = useMemo<Vec3>(() => [px, py, pz], [px, py, pz]);
  const rotation = useMemo<Vec3>(() => [rx, ry, rz], [rx, ry, rz]);
  const size = useMemo<Vec3>(
    () => [width * sx, height * sy, depth * sz],
    [width, height, depth, sx, sy, sz]
  );
  const buoyancy = useMemo(
    () =>
      spec.buoyancy === undefined
        ? null
        : resolveBuoyancy(spec.buoyancy, {
            shape: primitiveHullShape(spec.shape),
            size,
          }),
    [spec.buoyancy, spec.shape, size]
  );
  const physics = useMemo(
    () => resolvePhysics(spec.physics, buoyancy !== null),
    [spec.physics, buoyancy]
  );
  const scaled = <group scale={transform.scale}>{children}</group>;

  if (physics === null) {
    return (
      <group position={position} rotation={rotation} scale={transform.scale}>
        {children}
      </group>
    );
  }
  if (buoyancy !== null) {
    return (
      <FloatingObject
        id={spec.id}
        buoyancy={buoyancy}
        physics={physics}
        shape={spec.shape}
        size={size}
        position={position}
        rotation={rotation}
      >
        {scaled}
      </FloatingObject>
    );
  }
  return (
    <PhysicsObject
      id={spec.id}
      physics={physics}
      shape={spec.shape}
      size={size}
      position={position}
      rotation={rotation}
    >
      {scaled}
    </PhysicsObject>
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
