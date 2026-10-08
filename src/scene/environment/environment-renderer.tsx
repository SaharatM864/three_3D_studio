import {
  environmentEpochMs,
  type ResolvedEnvironment,
} from "@/presets/environments";

import { Atmosphere } from "../atmosphere/atmosphere";
import { Sky } from "../atmosphere/sky";
import { SunLight } from "../atmosphere/sun-light";

export interface EnvironmentRendererProps {
  environment: ResolvedEnvironment;
}

export function EnvironmentRenderer({ environment }: EnvironmentRendererProps) {
  return (
    <Atmosphere
      location={environment.location}
      epochMs={environmentEpochMs(environment.dateTime)}
    >
      <Sky />
      <SunLight />
    </Atmosphere>
  );
}
