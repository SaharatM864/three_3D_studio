import type { ComponentType } from "react";

import type { JsonValue } from "@/model/types";

/** Props passed to a custom component (`kind: "custom"` objects). */
export interface SceneComponentProps {
  /** Id of the SceneObjectSpec that mounted this component. */
  objectId: string;
  props: Readonly<Record<string, JsonValue>>;
}

/** Custom R3F components, keyed by `componentKey`. */
export type SceneComponents = Readonly<
  Record<string, ComponentType<SceneComponentProps>>
>;
