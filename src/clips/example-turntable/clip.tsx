import { defineClip } from "@/clips/define-clip";
import { DEFAULT_SEED, VIDEO_FORMATS } from "@/project/defaults";
import { lightingPresets } from "@/presets/lighting";

const DURATION_IN_FRAMES = 300;
const LAST_FRAME = DURATION_IN_FRAMES - 1;

export default defineClip({
  project: {
    schemaVersion: 1,
    id: "example-turntable",
    title: "Example: Turntable",
    video: {
      ...VIDEO_FORMATS["landscape-1080p30"],
      durationInFrames: DURATION_IN_FRAMES,
    },
    seed: DEFAULT_SEED,
    environment: { presetId: "studio-gray" },
    camera: {
      position: {
        keyframes: [
          { frame: 0, value: [4, 2, 6], easing: "easeInOutCubic" },
          { frame: LAST_FRAME, value: [-4, 3, 6] },
        ],
      },
      target: [0, 0.5, 0],
      fov: 35,
    },
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
        id: "hero",
        kind: "primitive",
        shape: "box",
        transform: {
          position: [0, 0.5, 0],
          rotation: {
            keyframes: [
              { frame: 0, value: [0, 0, 0] },
              { frame: LAST_FRAME, value: [0, Math.PI * 2, 0] },
            ],
          },
        },
        material: { presetId: "glossy-paint" },
        castShadow: true,
      },
    ],
    audio: [],
  },
});
