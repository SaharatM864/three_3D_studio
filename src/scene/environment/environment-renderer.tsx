import type { ResolvedEnvironment } from "@/presets/environments";

import { Atmosphere } from "../atmosphere/atmosphere";
import { Sky } from "../atmosphere/sky";
import { SunLight } from "../atmosphere/sun-light";

export interface EnvironmentRendererProps {
  environment: ResolvedEnvironment;
}

export function EnvironmentRenderer({ environment }: EnvironmentRendererProps) {
  const epochMs = Date.parse(environment.dateTime);
  if (Number.isNaN(epochMs)) {
    throw new Error(`Invalid environment dateTime "${environment.dateTime}"`);
  }

  return (
    <Atmosphere location={environment.location} epochMs={epochMs}>
      <Sky />
      <SunLight />
    </Atmosphere>
  );
}
