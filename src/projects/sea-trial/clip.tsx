import { DEFAULT_SEED, VIDEO_FORMATS } from "@/model/defaults";
import { defineClip } from "@/projects/define";

import scene, { VIEW_POSITION } from "./scene";

export default defineClip(scene, {
  schemaVersion: 1,
  id: "sea-trial",
  title: "Sea trial",
  video: {
    ...VIDEO_FORMATS["landscape-1080p30"],
    durationInFrames: 300,
  },
  seed: DEFAULT_SEED,
  camera: {
    position: VIEW_POSITION,
    target: [0, 0, 0],
    fov: 50,
  },
  audio: [],
});
