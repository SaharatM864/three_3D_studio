import { useMemo } from "react";

import { useDisposable } from "../use-disposable";
import { skyBackground, skyEnvironment } from "./takram";

export function Sky() {
  const background = useMemo(() => skyBackground(), []);
  const environment = useMemo(() => skyEnvironment(), []);
  useDisposable(background);
  useDisposable(environment);

  return (
    <>
      <primitive object={background} attach="backgroundNode" />
      <primitive object={environment} attach="environmentNode" />
    </>
  );
}
