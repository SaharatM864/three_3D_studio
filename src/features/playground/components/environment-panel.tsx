import {
  ChevronDown,
  ChevronUp,
  Droplets,
  Lightbulb,
  Mountain,
  Palette,
  SlidersHorizontal,
  Waves,
} from "lucide-react";
import { useState, type CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SettingRange } from "@/game/settings";
import { cn } from "@/lib/utils";
import type { SceneSpec } from "@/model/types";
import {
  environmentPresets,
  isEnvironmentPresetId,
} from "@/presets/environments";
import { isLightingPresetId, lightingPresets } from "@/presets/lighting";
import { materialPresets, type MaterialPreset } from "@/presets/materials";
import {
  isOceanPresetId,
  isUnderwaterPresetId,
  oceanPresets,
  resolveUnderwater,
  underwaterPresets,
  WHITE_BALANCE_BOUNDS,
  type OceanOverride,
  type UnderwaterPresetId,
} from "@/presets/ocean";
import { presetIds } from "@/presets/registry";
import { usePlaygroundStore } from "@/stores/playground-store";

import {
  floatingPanelClass,
  PanelSection,
  PresetItem,
  PresetToggleGroup,
} from "./panel-controls";
import { SliderSetting } from "./settings-fields";

const PROJECT_VALUE = "project";
const OCEAN_OFF: OceanOverride = "off";

const lightingIds = presetIds(lightingPresets);
const environmentIds = presetIds(environmentPresets);
const oceanIds = presetIds(oceanPresets);
const underwaterIds = presetIds(underwaterPresets);

const WHITE_BALANCE_RANGE: SettingRange = {
  min: WHITE_BALANCE_BOUNDS[0],
  max: WHITE_BALANCE_BOUNDS[1],
  step: 0.05,
};

function isOceanOverride(value: string): value is OceanOverride {
  return value === OCEAN_OFF || isOceanPresetId(value);
}

function projectOceanLabel({ environment: { ocean } }: SceneSpec): string {
  if (ocean === undefined) return "ไม่มี";
  if (ocean.presetId !== undefined && isOceanPresetId(ocean.presetId)) {
    return oceanPresets[ocean.presetId].label;
  }
  return "กำหนดเอง";
}

function projectUnderwaterLabel({ environment: { ocean } }: SceneSpec): string {
  const underwater = ocean?.underwater;
  if (underwater === undefined) return underwaterPresets.ocean.label;
  const { presetId, ...fields } = underwater;
  if (Object.keys(fields).length > 0) return "กำหนดเอง";
  return presetId !== undefined && isUnderwaterPresetId(presetId)
    ? underwaterPresets[presetId].label
    : underwaterPresets.ocean.label;
}

function projectWhiteBalance(
  { environment: { ocean } }: SceneSpec,
  presetId: UnderwaterPresetId | null
): number {
  const underwater = presetId === null ? ocean?.underwater : { presetId };
  return resolveUnderwater(undefined, underwater).whiteBalance;
}

const materialEntries = Object.entries(materialPresets) as [
  string,
  MaterialPreset,
][];

function swatchStyle({ material }: MaterialPreset): CSSProperties {
  const color = typeof material.color === "string" ? material.color : "#888";
  const roughness =
    typeof material.roughness === "number" ? material.roughness : 0.5;
  const metalness =
    typeof material.metalness === "number" ? material.metalness : 0;
  const shine = (1 - roughness) * (0.35 + metalness * 0.5);
  const glow =
    material.emissive && typeof material.emissiveIntensity === "number"
      ? `0 0 ${6 + material.emissiveIntensity * 4}px ${material.emissive}`
      : undefined;

  return {
    background: `radial-gradient(circle at 32% 28%, rgb(255 255 255 / ${shine}) 0%, transparent 55%), ${material.emissive ?? color}`,
    boxShadow: glow,
  };
}

export function EnvironmentPanel({ scene }: { scene: SceneSpec }) {
  const [open, setOpen] = useState(true);
  const isPointerLocked = usePlaygroundStore((s) => s.isPointerLocked);
  const lightingPresetId = usePlaygroundStore((s) => s.lightingPresetId);
  const environmentPresetId = usePlaygroundStore((s) => s.environmentPresetId);
  const setLightingPreset = usePlaygroundStore((s) => s.setLightingPreset);
  const setEnvironmentPreset = usePlaygroundStore(
    (s) => s.setEnvironmentPreset
  );
  const oceanOverride = usePlaygroundStore((s) => s.oceanOverride);
  const setOceanOverride = usePlaygroundStore((s) => s.setOceanOverride);
  const underwaterPresetId = usePlaygroundStore((s) => s.underwaterPresetId);
  const setUnderwaterPreset = usePlaygroundStore((s) => s.setUnderwaterPreset);
  const underwaterWhiteBalance = usePlaygroundStore(
    (s) => s.underwaterWhiteBalance
  );
  const setUnderwaterWhiteBalance = usePlaygroundStore(
    (s) => s.setUnderwaterWhiteBalance
  );
  const hasOcean =
    oceanOverride === null
      ? scene.environment.ocean !== undefined
      : oceanOverride !== OCEAN_OFF;

  const projectEnvironment = scene.environment.presetId;
  const projectPreset =
    projectEnvironment && isEnvironmentPresetId(projectEnvironment)
      ? environmentPresets[projectEnvironment]
      : undefined;

  return (
    <aside
      data-hidden={isPointerLocked || undefined}
      className={cn(
        "absolute top-3 right-3 w-76 max-w-[calc(100%-1.5rem)]",
        floatingPanelClass
      )}
    >
      <header className="flex h-10 items-center gap-2 pr-1.5 pl-3">
        <SlidersHorizontal className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-medium">แสงและสภาพแวดล้อม</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-auto"
          aria-expanded={open}
          aria-label={open ? "พับเก็บ" : "ขยาย"}
          onClick={() => setOpen(!open)}
        >
          {open ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </header>

      {open && (
        <div className="flex flex-col gap-4 border-t p-3">
          <PanelSection icon={Lightbulb} title="แสง">
            <PresetToggleGroup
              label="ชุดแสง"
              value={lightingPresetId ?? PROJECT_VALUE}
              onValueChange={(next) =>
                setLightingPreset(isLightingPresetId(next) ? next : null)
              }
            >
              <PresetItem value={PROJECT_VALUE}>
                ของ project
                <span className="text-muted-foreground">
                  {scene.lights.length} ดวง
                </span>
              </PresetItem>
              {lightingIds.map((id) => (
                <PresetItem key={id} value={id}>
                  {lightingPresets[id].label}
                </PresetItem>
              ))}
            </PresetToggleGroup>
          </PanelSection>

          <PanelSection icon={Mountain} title="สภาพแวดล้อม">
            <PresetToggleGroup
              label="สภาพแวดล้อม"
              value={environmentPresetId ?? PROJECT_VALUE}
              onValueChange={(next) =>
                setEnvironmentPreset(isEnvironmentPresetId(next) ? next : null)
              }
            >
              <PresetItem value={PROJECT_VALUE}>
                <ColorDot color={projectPreset?.swatch} />
                ของ project
                {projectPreset && (
                  <span className="text-muted-foreground">
                    {projectPreset.label}
                  </span>
                )}
              </PresetItem>
              {environmentIds.map((id) => (
                <PresetItem key={id} value={id}>
                  <ColorDot color={environmentPresets[id].swatch} />
                  {environmentPresets[id].label}
                </PresetItem>
              ))}
            </PresetToggleGroup>
          </PanelSection>

          <PanelSection icon={Waves} title="ทะเล">
            <PresetToggleGroup
              label="ทะเล"
              value={oceanOverride ?? PROJECT_VALUE}
              onValueChange={(next) =>
                setOceanOverride(isOceanOverride(next) ? next : null)
              }
            >
              <PresetItem value={PROJECT_VALUE}>
                ของ project
                <span className="text-muted-foreground">
                  {projectOceanLabel(scene)}
                </span>
              </PresetItem>
              <PresetItem value={OCEAN_OFF}>ปิด</PresetItem>
              {oceanIds.map((id) => (
                <PresetItem key={id} value={id}>
                  {oceanPresets[id].label}
                </PresetItem>
              ))}
            </PresetToggleGroup>
          </PanelSection>

          {hasOcean && (
            <PanelSection icon={Droplets} title="ใต้น้ำ">
              <PresetToggleGroup
                label="น้ำใต้ทะเล"
                value={underwaterPresetId ?? PROJECT_VALUE}
                onValueChange={(next) =>
                  setUnderwaterPreset(isUnderwaterPresetId(next) ? next : null)
                }
              >
                <PresetItem value={PROJECT_VALUE}>
                  ของ project
                  <span className="text-muted-foreground">
                    {projectUnderwaterLabel(scene)}
                  </span>
                </PresetItem>
                {underwaterIds.map((id) => (
                  <PresetItem key={id} value={id}>
                    {underwaterPresets[id].label}
                  </PresetItem>
                ))}
              </PresetToggleGroup>
              <SliderSetting
                label="สมดุลแสงขาว"
                value={
                  underwaterWhiteBalance ??
                  projectWhiteBalance(scene, underwaterPresetId)
                }
                range={WHITE_BALANCE_RANGE}
                format={(value) => `${Math.round(value * 100)}%`}
                onChange={setUnderwaterWhiteBalance}
              />
            </PanelSection>
          )}

          <PanelSection icon={Palette} title="วัสดุ">
            <div className="grid grid-cols-6 gap-2">
              {materialEntries.map(([id, preset]) => (
                <Tooltip key={id}>
                  <TooltipTrigger
                    aria-label={preset.label}
                    className="aspect-square w-full rounded-full ring-1 ring-white/15 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    style={swatchStyle(preset)}
                  />
                  <TooltipContent>{preset.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              เดินไปดูวัสดุจริงบนแท่นโชว์ในฉาก
            </p>
          </PanelSection>
        </div>
      )}
    </aside>
  );
}

function ColorDot({ color }: { color?: string }) {
  return (
    <span
      aria-hidden
      className="size-2.5 shrink-0 rounded-full ring-1 ring-white/20"
      style={{ background: color ?? "transparent" }}
    />
  );
}
