import { definePlayground } from "@/projects/define";

import scene, { VIEW_POSITION } from "./scene";

export default definePlayground(scene, {
  spawn: VIEW_POSITION,
});
