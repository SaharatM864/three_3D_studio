import type { FC } from "react";

import type { EnvironmentSpec } from "@/model/types";

export interface EnvironmentRendererProps {
  spec: EnvironmentSpec;
}

// TODO(M1): merge spec over environmentPresets[spec.presetId]; solid background,
// fog and tone mapping exposure. TODO(M4): HDRI via drei <Environment>.
export const EnvironmentRenderer: FC<EnvironmentRendererProps> = () => null;
