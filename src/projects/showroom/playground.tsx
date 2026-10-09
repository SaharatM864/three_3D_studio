import { definePlayground } from "@/projects/define";

import scene, { DECK_HEIGHT } from "./scene";

export default definePlayground(scene, {
  spawn: [0, 1 + DECK_HEIGHT, 6],
});
