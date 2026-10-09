import {
  ChevronDown,
  ChevronUp,
  Gauge,
  Lightbulb,
  type LucideIcon,
  Mountain,
  Palette,
  SlidersHorizontal,
  Waves,
} from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SceneSpec } from "@/model/types";
import {
  environmentPresets,
  isEnvironmentPresetId,
} from "@/presets/environments";
import { isLightingPresetId, lightingPresets } from "@/presets/lighting";
import { materialPresets, type MaterialPreset } from "@/presets/materials";
import {
  isOceanPresetId,
  oceanPresets,
  type OceanOverride,
} from "@/presets/ocean";
import { hasPreset, presetIds } from "@/presets/registry";
import {
  DEFAULT_RENDER_QUALITY,
  RENDER_QUALITIES,
  type RenderQualityId,
} from "@/scene/render-config";
import { usePlaygroundStore } from "@/stores/playground-store";

const PROJECT_VALUE = "project";
const OCEAN_OFF: OceanOverride = "off";

const RENDER_QUALITY_LABELS: Record<RenderQualityId, string> = {
  high: "สูง · เหมือน Studio",
  performance: "ลื่น",
};

const renderQualityIds = presetIds(RENDER_QUALITIES);
const lightingIds = presetIds(lightingPresets);
const environmentIds = presetIds(environmentPresets);
const oceanIds = presetIds(oceanPresets);

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
  const renderQuality = usePlaygroundStore((s) => s.renderQuality);
  const setRenderQuality = usePlaygroundStore((s) => s.setRenderQuality);

  const projectEnvironment = scene.environment.presetId;
  const projectPreset =
    projectEnvironment && isEnvironmentPresetId(projectEnvironment)
      ? environmentPresets[projectEnvironment]
      : undefined;

  return (
    <aside
      data-hidden={isPointerLocked || undefined}
      className="absolute top-3 right-3 w-76 max-w-[calc(100%-1.5rem)] rounded-xl border bg-background/85 shadow-xl backdrop-blur transition-opacity data-hidden:pointer-events-none data-hidden:opacity-0"
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

          <PanelSection icon={Gauge} title="คุณภาพการแสดงผล">
            <PresetToggleGroup
              label="คุณภาพการแสดงผล"
              value={renderQuality}
              onValueChange={(next) => {
                if (hasPreset(RENDER_QUALITIES, next)) setRenderQuality(next);
              }}
            >
              {renderQualityIds.map((id) => (
                <PresetItem key={id} value={id}>
                  {RENDER_QUALITY_LABELS[id]}
                </PresetItem>
              ))}
            </PresetToggleGroup>
            {renderQuality !== DEFAULT_RENDER_QUALITY && (
              <p className="text-[11px] text-muted-foreground">
                ลดคุณภาพเมฆและความละเอียดเพื่อความลื่น ภาพจะต่างจาก Studio
                และไฟล์ export
              </p>
            )}
          </PanelSection>
        </div>
      )}
    </aside>
  );
}

function PanelSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function PresetToggleGroup({
  label,
  value,
  onValueChange,
  children,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <ToggleGroup
      aria-label={label}
      variant="outline"
      size="sm"
      spacing={1}
      className="w-full flex-wrap"
      value={[value]}
      onValueChange={(values) => {
        const next = values[0];
        if (next !== undefined) onValueChange(next);
      }}
    >
      {children}
    </ToggleGroup>
  );
}

function PresetItem({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) {
  return (
    <ToggleGroupItem
      value={value}
      className="gap-1.5 aria-pressed:border-foreground/40 aria-pressed:bg-foreground/10 aria-pressed:text-foreground"
    >
      {children}
    </ToggleGroupItem>
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
