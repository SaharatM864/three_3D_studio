import { DEFAULT_SEED, VIDEO_FORMATS } from "@/model/defaults";
import { defineClip } from "@/projects/define";

import scene, { SPAWN_Z } from "./scene";

const DURATION_IN_FRAMES = 240;
const LAST_FRAME = DURATION_IN_FRAMES - 1;
const START_Y = -6;
const END_Y = 1.5;

export default defineClip(scene, {
  schemaVersion: 1,
  id: "underwater",
  title: "Underwater",
  video: {
    ...VIDEO_FORMATS["landscape-1080p30"],
    durationInFrames: DURATION_IN_FRAMES,
  },
  seed: DEFAULT_SEED,
  camera: {
    position: {
      keyframes: [
        { frame: 0, value: [0, START_Y, SPAWN_Z + 2], easing: "easeInOutQuad" },
        { frame: LAST_FRAME, value: [0, END_Y, SPAWN_Z + 2] },
      ],
    },
    target: {
      keyframes: [
        { frame: 0, value: [0, START_Y, 0], easing: "easeInOutQuad" },
        { frame: LAST_FRAME, value: [0, 0.5, 0] },
      ],
    },
    fov: 50,
  },
  audio: [],
});
