import { useMemo } from "react";
import { Object3D } from "three";

import type { LightSpec, Vec3 } from "@/model/types";
import type { EvaluatedLight } from "@/timeline/types";

export interface LightRigProps {
  lights: readonly LightSpec[];
  values: readonly EvaluatedLight[];
}

type LightOf<K extends LightSpec["kind"]> = Extract<LightSpec, { kind: K }>;

const ORIGIN: Vec3 = [0, 0, 0];

export function LightRig({ lights, values }: LightRigProps) {
  return lights.map((light, index) => (
    <Light key={light.id} spec={light} value={values[index]} />
  ));
}

function Light({ spec, value }: { spec: LightSpec; value: EvaluatedLight }) {
  switch (spec.kind) {
    case "ambient":
      return <ambientLight color={value.color} intensity={value.intensity} />;
    case "hemisphere":
      return (
        <hemisphereLight
          color={value.color}
          groundColor={spec.groundColor}
          intensity={value.intensity}
        />
      );
    case "point":
      return (
        <pointLight
          position={value.position ?? ORIGIN}
          color={value.color}
          intensity={value.intensity}
          distance={spec.distance}
          decay={spec.decay}
          castShadow={spec.castShadow}
        />
      );
    case "directional":
      return <DirectionalLight spec={spec} value={value} />;
    case "spot":
      return <SpotLight spec={spec} value={value} />;
  }
}

function DirectionalLight({
  spec,
  value,
}: {
  spec: LightOf<"directional">;
  value: EvaluatedLight;
}) {
  const target = useMemo(() => new Object3D(), []);
  return (
    <>
      <directionalLight
        position={value.position ?? ORIGIN}
        color={value.color}
        intensity={value.intensity}
        castShadow={spec.castShadow}
        target={target}
      />
      <primitive object={target} position={value.target ?? ORIGIN} />
    </>
  );
}

function SpotLight({
  spec,
  value,
}: {
  spec: LightOf<"spot">;
  value: EvaluatedLight;
}) {
  const target = useMemo(() => new Object3D(), []);
  return (
    <>
      <spotLight
        position={value.position ?? ORIGIN}
        color={value.color}
        intensity={value.intensity}
        angle={spec.angle}
        penumbra={spec.penumbra}
        castShadow={spec.castShadow}
        target={target}
      />
      <primitive object={target} position={value.target ?? ORIGIN} />
    </>
  );
}
