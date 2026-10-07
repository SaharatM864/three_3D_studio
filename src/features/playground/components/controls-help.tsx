import { Mouse } from "lucide-react";
import type { ReactNode } from "react";

import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { controlsMap, type ControlName } from "@/game/controls";
import { cn } from "@/lib/utils";

const CONTROL_LABELS: Record<ControlName, string> = {
  forward: "เดินหน้า",
  backward: "ถอยหลัง",
  left: "ไปทางซ้าย",
  right: "ไปทางขวา",
  jump: "กระโดด",
  run: "วิ่ง (กดค้าง)",
  interact: "ใช้งาน",
};

const KEY_LABELS: Record<string, string> = {
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  ShiftLeft: "Shift",
  ShiftRight: "Shift",
};

function keyLabel(code: string) {
  return KEY_LABELS[code] ?? code.replace(/^(Key|Digit)/, "");
}

function ControlRow({ keys, label }: { keys: ReactNode; label: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <KbdGroup>{keys}</KbdGroup>
    </li>
  );
}

export function ControlsHelp({ className }: { className?: string }) {
  return (
    <ul
      className={cn("grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2", className)}
    >
      {controlsMap.map((control) => {
        const labels = [...new Set(control.keys.map(keyLabel))];
        return (
          <ControlRow
            key={control.name}
            label={CONTROL_LABELS[control.name]}
            keys={labels.map((label) => (
              <Kbd key={label}>{label}</Kbd>
            ))}
          />
        );
      })}
      <ControlRow
        label="หันมอง"
        keys={
          <Kbd>
            <Mouse />
            เมาส์
          </Kbd>
        }
      />
      <ControlRow label="ปล่อยเมาส์" keys={<Kbd>Esc</Kbd>} />
    </ul>
  );
}
