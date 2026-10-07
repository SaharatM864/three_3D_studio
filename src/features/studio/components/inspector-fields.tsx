import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Animatable, ColorValue, Keyframe, Vec3 } from "@/model/types";
import { useStudioStore } from "@/stores/studio-store";
import { isTrack } from "@/timeline/track";

import { formatNumber, formatTimecode } from "../format";
import { useStudioController } from "../studio-controller";

export function InspectorSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2 border-b px-3 py-3 last:border-b-0">
      <h3 className="text-[11px] font-medium text-muted-foreground">{title}</h3>
      <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-x-2 gap-y-2 text-xs">
        {children}
      </dl>
    </section>
  );
}

export function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <>
      <dt className="truncate pt-0.5 text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </>
  );
}

export function DefaultValue({ label = "ค่าเริ่มต้น" }: { label?: string }) {
  return <span className="text-muted-foreground/70 italic">{label}</span>;
}

const AXES = [
  { name: "x", className: "text-red-400" },
  { name: "y", className: "text-green-400" },
  { name: "z", className: "text-sky-400" },
] as const;

export function Vec3Value({ value }: { value: Vec3 }) {
  return (
    <span className="grid grid-cols-3 gap-1">
      {AXES.map((axis, index) => (
        <span
          key={axis.name}
          className="flex min-w-0 items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 font-mono tabular-nums"
        >
          <span className={cn("text-[10px]", axis.className)}>{axis.name}</span>
          <span className="truncate">{formatNumber(value[index])}</span>
        </span>
      ))}
    </span>
  );
}

export function ColorSwatch({ value }: { value: ColorValue }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="size-3.5 shrink-0 rounded-sm ring-1 ring-foreground/20"
        style={{ background: value }}
      />
      <span className="truncate font-mono uppercase">{value}</span>
    </span>
  );
}

export function NumberValue({ value, unit }: { value: number; unit?: string }) {
  return (
    <span className="font-mono tabular-nums">
      {formatNumber(value)}
      {unit && <span className="ml-0.5 text-muted-foreground">{unit}</span>}
    </span>
  );
}

export function TextValue({ value }: { value: string }) {
  return <span className="font-mono break-all">{value}</span>;
}

export function BooleanValue({ value }: { value: boolean | undefined }) {
  return value ? <span>เปิด</span> : <DefaultValue label="ปิด" />;
}

export const renderVec3 = (value: Vec3) => <Vec3Value value={value} />;
export const renderColor = (value: ColorValue) => <ColorSwatch value={value} />;
export const renderNumber = (unit?: string) =>
  function NumberRenderer(value: number) {
    return <NumberValue value={value} unit={unit} />;
  };

export function AnimatableValue<T>({
  value,
  fps,
  render,
}: {
  value: Animatable<T> | undefined;
  fps: number;
  render: (value: T) => ReactNode;
}) {
  if (value === undefined) return <DefaultValue />;
  if (!isTrack(value)) return <>{render(value)}</>;
  return <KeyframeList keyframes={value.keyframes} fps={fps} render={render} />;
}

// TODO(M2): show evaluateAnimatable(value, displayFrame) above the list.
function KeyframeList<T>({
  keyframes,
  fps,
  render,
}: {
  keyframes: readonly Keyframe<T>[];
  fps: number;
  render: (value: T) => ReactNode;
}) {
  const controller = useStudioController();
  const displayFrame = useStudioStore((s) => s.displayFrame);

  return (
    <div className="flex flex-col gap-1">
      <Badge
        variant="outline"
        className="border-keyframe/40 font-normal text-keyframe"
      >
        <span aria-hidden className="size-1.5 rotate-45 bg-keyframe" />
        Keyframe ×{keyframes.length}
      </Badge>
      <ol className="flex flex-col gap-0.5">
        {keyframes.map((keyframe) => (
          <li key={keyframe.frame}>
            <button
              type="button"
              aria-current={keyframe.frame === displayFrame || undefined}
              onClick={() => controller.seek(keyframe.frame)}
              className="grid w-full grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-1.5 rounded px-1 py-1 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 aria-[current]:bg-keyframe/10"
            >
              <span
                className="pt-0.5 font-mono text-[11px] text-muted-foreground tabular-nums"
                title={formatTimecode(keyframe.frame, fps)}
              >
                f{keyframe.frame}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                {render(keyframe.value)}
                <span className="text-[10px] text-muted-foreground">
                  {keyframe.easing ?? "linear"}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
