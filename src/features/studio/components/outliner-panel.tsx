import type { LucideIcon } from "lucide-react";
import { useMemo, type ReactNode } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { ClipSpec } from "@/model/types";
import {
  selectionKey,
  useStudioStore,
  type StudioSelection,
} from "@/stores/studio-store";

import {
  audioIcon,
  cameraIcon,
  environmentIcon,
  environmentPresetLabel,
  lightIcons,
  objectDetail,
  objectIcon,
} from "../scene-meta";
import { collectTimelineGroups } from "../timeline-rows";
import { Panel, PanelHeader } from "./panel";

export function OutlinerPanel({ clip }: { clip: ClipSpec }) {
  const animatedKeys = useMemo(
    () => new Set(collectTimelineGroups(clip).map((group) => group.key)),
    [clip]
  );
  const isAnimated = (target: StudioSelection) =>
    animatedKeys.has(selectionKey(target));

  return (
    <Panel className="border-r">
      <PanelHeader title="Outliner" />
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-2">
          <OutlinerGroup title="ฉาก">
            <OutlinerItem
              target={{ kind: "environment" }}
              icon={environmentIcon}
              label="สภาพแวดล้อม"
              detail={environmentPresetLabel(clip.environment.presetId)}
            />
            <OutlinerItem
              target={{ kind: "camera" }}
              icon={cameraIcon}
              label="กล้อง"
              animated={isAnimated({ kind: "camera" })}
            />
          </OutlinerGroup>

          <OutlinerGroup title="ไฟ" count={clip.lights.length}>
            {clip.lights.map((light) => {
              const target: StudioSelection = { kind: "light", id: light.id };
              return (
                <OutlinerItem
                  key={light.id}
                  target={target}
                  icon={lightIcons[light.kind]}
                  label={light.id}
                  detail={light.kind}
                  animated={isAnimated(target)}
                />
              );
            })}
          </OutlinerGroup>

          <OutlinerGroup title="วัตถุ" count={clip.objects.length}>
            {clip.objects.map((object) => {
              const target: StudioSelection = {
                kind: "object",
                id: object.id,
              };
              return (
                <OutlinerItem
                  key={object.id}
                  target={target}
                  icon={objectIcon(object)}
                  label={object.id}
                  detail={objectDetail(object)}
                  animated={isAnimated(target)}
                />
              );
            })}
          </OutlinerGroup>

          <OutlinerGroup
            title="เสียง"
            count={clip.audio.length}
            empty="ยังไม่มีเสียงในคลิปนี้"
          >
            {clip.audio.map((audio) => (
              <OutlinerItem
                key={audio.id}
                target={{ kind: "audio", id: audio.id }}
                icon={audioIcon}
                label={audio.id}
              />
            ))}
          </OutlinerGroup>
        </div>
      </ScrollArea>
    </Panel>
  );
}

function OutlinerGroup({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count?: number;
  empty?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between px-2 pb-1 text-[11px] font-medium text-muted-foreground">
        <span>{title}</span>
        {count !== undefined && <span className="tabular-nums">{count}</span>}
      </div>
      {count === 0 && empty ? (
        <p className="px-2 py-1 text-xs text-muted-foreground/70">{empty}</p>
      ) : (
        children
      )}
    </div>
  );
}

function OutlinerItem({
  target,
  icon: Icon,
  label,
  detail,
  animated = false,
}: {
  target: StudioSelection;
  icon: LucideIcon;
  label: string;
  detail?: string;
  animated?: boolean;
}) {
  const key = selectionKey(target);
  const isSelected = useStudioStore(
    (s) => s.selection !== null && selectionKey(s.selection) === key
  );
  const setSelection = useStudioStore((s) => s.setSelection);

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => setSelection(target)}
      className="group flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-xs text-foreground/90 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 aria-pressed:bg-foreground/10 aria-pressed:text-foreground"
    >
      <Icon className="size-3.5 shrink-0 text-muted-foreground group-aria-pressed:text-foreground" />
      <span className="truncate">{label}</span>
      {detail && (
        <span className="truncate text-[11px] text-muted-foreground">
          {detail}
        </span>
      )}
      {animated && (
        <span className="ml-auto flex shrink-0 items-center">
          <span aria-hidden className="size-1.5 rotate-45 bg-keyframe" />
          <span className="sr-only">มี keyframe</span>
        </span>
      )}
    </button>
  );
}
