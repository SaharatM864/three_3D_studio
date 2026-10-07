import type { ComponentType } from "react";

import type { JsonValue } from "@/model/types";

export interface SceneComponentProps {
  objectId: string;
  props: Readonly<Record<string, JsonValue>>;
}

export type SceneComponents = Readonly<
  Record<string, ComponentType<SceneComponentProps>>
>;
