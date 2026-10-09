import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const floatingPanelClass =
  "rounded-xl border bg-background/85 shadow-xl backdrop-blur transition-opacity data-hidden:pointer-events-none data-hidden:opacity-0";

export function PanelSection({
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

export function PresetToggleGroup({
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

export function PresetItem({
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
