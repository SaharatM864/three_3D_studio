import { DEFAULT_SEED, VIDEO_FORMATS } from "@/model/defaults";
import { defineClip } from "@/projects/define";

import scene, { PLINTH_ROW_HALF_WIDTH } from "./scene";

const DURATION_IN_FRAMES = 300;
const LAST_FRAME = DURATION_IN_FRAMES - 1;
const OVERSHOOT = 1.5;
const START_X = -PLINTH_ROW_HALF_WIDTH - OVERSHOOT;
const END_X = PLINTH_ROW_HALF_WIDTH + OVERSHOOT;

export default defineClip(scene, {
  schemaVersion: 1,
  id: "showroom",
  title: "Showroom",
  video: {
    ...VIDEO_FORMATS["landscape-1080p30"],
    durationInFrames: DURATION_IN_FRAMES,
  },
  seed: DEFAULT_SEED,
  camera: {
    position: {
      keyframes: [
        { frame: 0, value: [START_X, 1.6, 4], easing: "easeInOutQuad" },
        { frame: LAST_FRAME, value: [END_X, 1.6, 4] },
      ],
    },
    target: {
      keyframes: [
        { frame: 0, value: [START_X, 1, 0], easing: "easeInOutQuad" },
        { frame: LAST_FRAME, value: [END_X, 1, 0] },
      ],
    },
    fov: 40,
  },
  audio: [],
});
