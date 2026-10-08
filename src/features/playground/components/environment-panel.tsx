import {
  ChevronDown,
  ChevronUp,
  Lightbulb,
  type LucideIcon,
  Mountain,
  Palette,
  SlidersHorizontal,
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
  type EnvironmentPresetId,
} from "@/presets/environments";
import { lightingPresets, type LightingPresetId } from "@/presets/lighting";
import { materialPresets, type MaterialPreset } from "@/presets/materials";
import { usePlaygroundStore } from "@/stores/playground-store";

const PROJECT_VALUE = "project";

const lightingIds = Object.keys(lightingPresets) as LightingPresetId[];
const environmentIds = Object.keys(environmentPresets) as EnvironmentPresetId[];
const materialEntries = Object.entries(materialPresets) as [
  string,
  MaterialPreset,
][];

function isLightingPresetId(value: string): value is LightingPresetId {
  return value in lightingPresets;
}

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
            <ToggleGroup
              aria-label="ชุดแสง"
              variant="outline"
              size="sm"
              spacing={1}
              className="w-full flex-wrap"
              value={[lightingPresetId ?? PROJECT_VALUE]}
              onValueChange={(values) => {
                const next = values[0];
                if (next === undefined) return;
                setLightingPreset(isLightingPresetId(next) ? next : null);
              }}
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
            </ToggleGroup>
          </PanelSection>

          <PanelSection icon={Mountain} title="สภาพแวดล้อม">
            <ToggleGroup
              aria-label="สภาพแวดล้อม"
              variant="outline"
              size="sm"
              spacing={1}
              className="w-full flex-wrap"
              value={[environmentPresetId ?? PROJECT_VALUE]}
              onValueChange={(values) => {
                const next = values[0];
                if (next === undefined) return;
                setEnvironmentPreset(isEnvironmentPresetId(next) ? next : null);
              }}
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
            </ToggleGroup>
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
