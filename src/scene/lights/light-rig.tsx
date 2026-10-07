import type { FC } from "react";

import type { LightSpec } from "@/model/types";

export interface LightRigProps {
  lights: readonly LightSpec[];
}

// TODO(M1): one three.js light per spec (switch on kind), registered by id.
export const LightRig: FC<LightRigProps> = () => null;
