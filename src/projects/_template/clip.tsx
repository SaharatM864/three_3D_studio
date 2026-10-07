import { DEFAULT_SEED, VIDEO_FORMATS } from "@/model/defaults";
import { defineClip } from "@/projects/define";

import scene from "./scene";

const DURATION_IN_FRAMES = 150;

/**
 * The project's video: camera, timing, audio and keyframes on top of the
 * scene. `animate` targets scene objects by id; `extraObjects` exist only in
 * the video (e.g. titles).
 */
export default defineClip(scene, {
  schemaVersion: 1,
  id: "_template",
  title: "Template",
  video: {
    ...VIDEO_FORMATS["landscape-1080p30"],
    durationInFrames: DURATION_IN_FRAMES,
  },
  seed: DEFAULT_SEED,
  camera: { position: [0, 1.5, 5], target: [0, 0.5, 0], fov: 40 },
  animate: {
    box: {
      transform: {
        position: {
          keyframes: [
            { frame: 0, value: [-1.5, 0.5, 0], easing: "easeInOutCubic" },
            { frame: DURATION_IN_FRAMES - 1, value: [1.5, 0.5, 0] },
          ],
        },
      },
    },
  },
  audio: [],
});
