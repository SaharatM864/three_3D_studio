/**
 * Copy this folder to src/clips/<clip-id>/ to start a new clip, then register
 * it in ../manifest.ts and ../loaders.ts. See docs/clip-authoring.md.
 *
 * Not listed in the manifest, so it is never loaded; it only has to typecheck.
 */
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

import { defineClip, type ClipComponentProps } from "@/clips/define-clip";
import { DEFAULT_SEED, VIDEO_FORMATS } from "@/project/defaults";
import { lightingPresets } from "@/presets/lighting";
import { useClipFrame } from "@/scene/clip-clock";

const DURATION_IN_FRAMES = 150;

/**
 * Optional custom component, for motion keyframes cannot express. Derive
 * every value from `clock.current` — never from useFrame's delta,
 * Date.now() or Math.random() (use createSeededRandom(project.seed)).
 */
function PulsingSphere({ props }: ClipComponentProps) {
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

export default defineClip({
  project: {
    schemaVersion: 1,
    id: "_template",
    title: "Template",
    video: {
      ...VIDEO_FORMATS["landscape-1080p30"],
      durationInFrames: DURATION_IN_FRAMES,
    },
    seed: DEFAULT_SEED,
    environment: { presetId: "studio-gray" },
    camera: { position: [0, 1.5, 5], target: [0, 0.5, 0], fov: 40 },
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
        transform: {
          position: {
            keyframes: [
              { frame: 0, value: [-1.5, 0.5, 0], easing: "easeInOutCubic" },
              { frame: DURATION_IN_FRAMES - 1, value: [1.5, 0.5, 0] },
            ],
          },
        },
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
    audio: [],
  },
  components: {
    "pulsing-sphere": PulsingSphere,
  },
});
