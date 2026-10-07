import { definePlayground } from "@/projects/define";

import scene from "./scene";

/** Spawn facing the row of material swatches. */
export default definePlayground(scene, {
  spawn: [0, 1, 6],
});
