import { useMemo } from "react";

import { useDisposable } from "../use-disposable";
import { skyBackground, skyEnvironment } from "./takram";

export function Sky() {
  const background = useMemo(() => createSkyBackground(), []);
  const environment = useMemo(() => skyEnvironment(), []);
  useDisposable(background);
  useDisposable(background.starsNode);
  useDisposable(environment);

  return (
    <>
      <primitive object={background} attach="backgroundNode" />
      <primitive object={environment} attach="environmentNode" />
    </>
  );
}

// TODO(future): self-host stars.bin (same-origin) before enabling stars for night scenes.
function createSkyBackground() {
  const background = skyBackground();
  background.showStars = false;
  return background;
}
