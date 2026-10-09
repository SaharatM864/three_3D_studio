import { definePlayground } from "@/projects/define";

import scene, { EYE_Y, SPAWN_Z } from "./scene";

export default definePlayground(scene, {
  spawn: [0, EYE_Y, SPAWN_Z],
});
