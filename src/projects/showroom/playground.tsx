import { definePlayground } from "@/projects/define";

import scene, { DECK_DEPTH, DECK_HEIGHT } from "./scene";

export default definePlayground(scene, {
  spawn: [0, DECK_HEIGHT + 1, DECK_DEPTH / 2 - 1],
});
