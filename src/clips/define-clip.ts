import type { ComponentType } from "react";

import type { ClipProject, JsonValue } from "@/project/types";

/** Props passed to a clip's custom component (`kind: "custom"` objects). */
export interface ClipComponentProps {
  /** Id of the SceneObjectSpec that mounted this component. */
  objectId: string;
  props: Readonly<Record<string, JsonValue>>;
}

/**
 * What every `src/clips/<id>/clip.tsx` default-exports.
 *
 * `project` is plain data. `components` holds R3F components for anything
 * keyframes cannot express; they must read time from useClipFrame() only.
 */
export interface ClipModule {
  project: ClipProject;
  components?: Readonly<Record<string, ComponentType<ClipComponentProps>>>;
}

export function defineClip(clip: ClipModule): ClipModule {
  return clip;
}
