import { Placeholder } from "@/components/placeholder";
import { Button } from "@/components/ui/button";
import {
  environmentPresets,
  type EnvironmentPresetId,
} from "@/presets/environments";
import { lightingPresets, type LightingPresetId } from "@/presets/lighting";
import { usePlaygroundStore } from "@/stores/playground-store";

const lightingIds = Object.keys(lightingPresets) as LightingPresetId[];
const environmentIds = Object.keys(environmentPresets) as EnvironmentPresetId[];

// TODO(G2): PlaygroundScene applies the selected presets; add material swatches.
export function EnvironmentPanel() {
  const {
    lightingPresetId,
    environmentPresetId,
    setLightingPreset,
    setEnvironmentPreset,
  } = usePlaygroundStore();

  return (
    <Placeholder
      title="แสงและสภาพแวดล้อม"
      milestone="G2"
      className="absolute top-4 right-4 w-72 bg-background/90"
    >
      <div className="flex flex-wrap gap-1">
        {lightingIds.map((id) => (
          <Button
            key={id}
            size="sm"
            variant={id === lightingPresetId ? "default" : "outline"}
            onClick={() => setLightingPreset(id)}
          >
            {lightingPresets[id].label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {environmentIds.map((id) => (
          <Button
            key={id}
            size="sm"
            variant={id === environmentPresetId ? "default" : "outline"}
            onClick={() => setEnvironmentPreset(id)}
          >
            {environmentPresets[id].label}
          </Button>
        ))}
      </div>
    </Placeholder>
  );
}
