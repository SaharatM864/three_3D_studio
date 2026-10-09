import { useMemo } from "react";

import { useDisposable } from "../use-disposable";
import { skyEnvironment } from "./takram";

export function SkyEnvironment() {
  const environment = useMemo(() => skyEnvironment(), []);
  useDisposable(environment);

  return <primitive object={environment} attach="environmentNode" />;
}
