/**
 * Copy this folder to src/projects/<project-id>/ to start a new project, then
 * register it in ../manifest.ts and ../loaders.ts. See docs/project-authoring.md.
 *
 * Not listed in the manifest, so it is never loaded; it only has to typecheck.
 */
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

import { defineScene, type SceneComponentProps } from "@/projects/define";
import { lightingPresets } from "@/presets/lighting";
import { useClipFrame } from "@/scene/clip-clock";

/**
 * Optional custom component, for motion the data cannot express. It runs in
 * the clip and the playground, so derive every value from `clock.current` —
 * never from useFrame's delta, Date.now() or Math.random() (use
 * createSeededRandom(seed)).
 */
function PulsingSphere({ props }: SceneComponentProps) {
  const clock = useClipFrame();
  const mesh = useRef<Mesh>(null);
  const speed = typeof props.speed === "number" ? props.speed : 1;

  useFrame(() => {
    if (!mesh.current) return;
    const scale =
      1 + 0.2 * Math.sin(clock.current.timeSeconds * speed * Math.PI * 2);
    mesh.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[0.5, 48, 24]} />
      <meshStandardMaterial color="#4f7cff" roughness={0.3} />
    </mesh>
  );
}

export default defineScene({
  spec: {
    environment: { presetId: "studio-gray" },
    lights: lightingPresets["studio-3-point"].lights,
    objects: [
      {
        id: "floor",
        kind: "primitive",
        shape: "plane",
        size: [20, 20, 1],
        transform: { rotation: [-Math.PI / 2, 0, 0] },
        material: { presetId: "matte-plastic" },
        receiveShadow: true,
      },
      {
        id: "box",
        kind: "primitive",
        shape: "box",
        transform: { position: [-1.5, 0.5, 0] },
        material: { presetId: "glossy-paint" },
        castShadow: true,
      },
      {
        id: "pulse",
        kind: "custom",
        componentKey: "pulsing-sphere",
        props: { speed: 0.5 },
        transform: { position: [0, 1.8, -1] },
      },
    ],
  },
  components: {
    "pulsing-sphere": PulsingSphere,
  },
});
