import { definePlayground } from "@/projects/define";

import scene from "./scene";

/**
 * Walk around the scene. Never recorded, so playground-only components (in
 * the third argument's `components`, mounted by `extraObjects`) may use real
 * time. `colliders` overrides the default fixed collider per object id.
 */
export default definePlayground(scene, {
  spawn: [0, 1, 6],
});
