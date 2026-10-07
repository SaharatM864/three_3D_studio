import { DEFAULT_SEED, VIDEO_FORMATS } from "@/model/defaults";
import { defineClip } from "@/projects/define";

import scene from "./scene";

const DURATION_IN_FRAMES = 300;
const LAST_FRAME = DURATION_IN_FRAMES - 1;

export default defineClip(scene, {
  schemaVersion: 1,
  id: "example-turntable",
  title: "Example: Turntable",
  video: {
    ...VIDEO_FORMATS["landscape-1080p30"],
    durationInFrames: DURATION_IN_FRAMES,
  },
  seed: DEFAULT_SEED,
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
  animate: {
    hero: {
      transform: {
        rotation: {
          keyframes: [
            { frame: 0, value: [0, 0, 0] },
            { frame: LAST_FRAME, value: [0, Math.PI * 2, 0] },
          ],
        },
      },
    },
  },
  audio: [],
});
