import type { ReactNode } from "react";

import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { SettingRange } from "@/game/settings";

import { PresetItem, PresetToggleGroup } from "./panel-controls";

function SettingLabel({
  label,
  detail,
}: {
  label: string;
  detail?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-xs">
      <span>{label}</span>
      {detail !== undefined && (
        <span className="text-muted-foreground tabular-nums">{detail}</span>
      )}
    </div>
  );
}

export function OptionSetting<T extends string | number>({
  label,
  detail,
  options,
  value,
  format = String,
  onChange,
}: {
  label: string;
  detail?: ReactNode;
  options: readonly T[];
  value: T | null;
  format?: (option: T) => ReactNode;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <SettingLabel label={label} detail={detail} />
      <PresetToggleGroup
        label={label}
        value={value === null ? "" : String(value)}
        onValueChange={(next) => {
          const option = options.find((item) => String(item) === next);
          if (option !== undefined) onChange(option);
        }}
      >
        {options.map((option) => (
          <PresetItem key={String(option)} value={String(option)}>
            {format(option)}
          </PresetItem>
        ))}
      </PresetToggleGroup>
    </div>
  );
}

export function SliderSetting({
  label,
  value,
  range,
  format,
  onChange,
}: {
  label: string;
  value: number;
  range: SettingRange;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <SettingLabel label={label} detail={format(value)} />
      <Slider
        aria-label={label}
        value={[value]}
        min={range.min}
        max={range.max}
        step={range.step}
        onValueChange={(next) =>
          onChange(typeof next === "number" ? next : (next[0] ?? value))
        }
      />
    </div>
  );
}

export function SwitchSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="flex flex-col gap-0.5">
        <span className="text-xs">{label}</span>
        {description && (
          <span className="text-[11px] text-muted-foreground">
            {description}
          </span>
        )}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
