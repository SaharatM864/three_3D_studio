import { Diamond, type LucideIcon } from "lucide-react";
import {
  Fragment,
  useMemo,
  useRef,
  type PointerEvent,
  type ReactNode,
} from "react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ClipSpec, VideoSettings } from "@/model/types";
import {
  selectionKey,
  useStudioStore,
  type StudioSelection,
} from "@/stores/studio-store";

import { audioIcon, selectionIcon } from "../scene-meta";
import { useStudioController } from "../studio-controller";
import {
  collectAudioRows,
  collectTimelineGroups,
  type AudioRow,
  type KeyframeMarker,
  type TimelineGroup,
} from "../timeline-rows";
import { Panel } from "./panel";

type FrameRatio = (frame: number) => number;

const percent = (ratio: number) => `${ratio * 100}%`;

export function TimelinePanel({ clip }: { clip: ClipSpec }) {
  const groups = useMemo(() => collectTimelineGroups(clip), [clip]);
  const audioRows = useMemo(() => collectAudioRows(clip), [clip]);
  const displayFrame = useStudioStore((s) => s.displayFrame);
  const lastFrame = Math.max(clip.video.durationInFrames - 1, 1);
  const ratio: FrameRatio = (frame) =>
    Math.min(Math.max(frame / lastFrame, 0), 1);
  const trackCount =
    groups.reduce((count, group) => count + group.rows.length, 0) +
    audioRows.length;

  return (
    <Panel className="flex-1">
      <ScrollArea className="min-h-0 flex-1">
        <div className="relative grid min-h-full grid-cols-[12rem_minmax(0,1fr)] content-start">
          <div className="sticky top-0 z-20 flex h-7 items-center gap-2 border-r border-b bg-background px-3 text-xs font-medium text-muted-foreground">
            Timeline
            <span className="ml-auto font-normal tabular-nums">
              {trackCount} track
            </span>
          </div>
          <TimelineRuler
            video={clip.video}
            displayFrame={displayFrame}
            ratio={ratio}
          />

          {trackCount === 0 ? (
            <div className="col-span-2">
              <Empty className="py-6">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Diamond />
                  </EmptyMedia>
                  <EmptyTitle>คลิปนี้ยังไม่มี keyframe</EmptyTitle>
                  <EmptyDescription className="text-xs">
                    ใส่ Track ให้กล้องหรือ animate ใน clip.tsx แล้ว keyframe
                    จะแสดงที่นี่
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <>
              {groups.map((group) => (
                <TimelineGroupRows
                  key={group.key}
                  clip={clip}
                  group={group}
                  ratio={ratio}
                />
              ))}
              {audioRows.length > 0 && (
                <AudioRows rows={audioRows} ratio={ratio} />
              )}
            </>
          )}

          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-3 left-[calc(12rem+0.75rem)] z-10"
          >
            <div
              className="absolute inset-y-0 w-px bg-playhead"
              style={{ left: percent(ratio(displayFrame)) }}
            />
          </div>
        </div>
      </ScrollArea>
    </Panel>
  );
}

const RULER_STEPS_SECONDS = [1, 2, 5, 10, 15, 30, 60, 120, 300];

function rulerTicks({ fps, durationInFrames }: VideoSettings) {
  const lastFrame = Math.max(durationInFrames - 1, 1);
  const seconds = lastFrame / fps;
  const stepSeconds =
    RULER_STEPS_SECONDS.find((step) => seconds / step <= 12) ?? 600;
  const majorFrames = Math.max(Math.round(stepSeconds * fps), 1);
  const subdivisions = [5, 4, 2].find((n) => majorFrames % n === 0) ?? 1;
  const minorFrames = majorFrames / subdivisions;

  const ticks: { frame: number; label?: string }[] = [];
  for (let frame = 0; frame <= lastFrame; frame += minorFrames) {
    const isMajor = frame % majorFrames === 0;
    ticks.push({
      frame,
      label: isMajor ? formatRulerLabel(frame / fps) : undefined,
    });
  }
  return ticks;
}

function formatRulerLabel(seconds: number) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
}

function TimelineRuler({
  video,
  displayFrame,
  ratio,
}: {
  video: VideoSettings;
  displayFrame: number;
  ratio: FrameRatio;
}) {
  const controller = useStudioController();
  const areaRef = useRef<HTMLDivElement>(null);
  const ticks = useMemo(() => rulerTicks(video), [video]);
  const lastFrame = Math.max(video.durationInFrames - 1, 1);

  function frameAt(clientX: number) {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    const position = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    return Math.round(position * lastFrame);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    controller.seek(frameAt(event.clientX));
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    controller.seek(frameAt(event.clientX));
  }

  return (
    <div className="sticky top-0 z-20 h-7 border-b bg-background px-3">
      <div
        ref={areaRef}
        role="presentation"
        className="relative h-full cursor-ew-resize touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
      >
        {ticks.map((tick) => (
          <div
            key={tick.frame}
            className="absolute bottom-0"
            style={{ left: percent(ratio(tick.frame)) }}
          >
            {tick.label && (
              <span className="absolute bottom-2.5 -translate-x-1/2 text-[10px] text-muted-foreground tabular-nums">
                {tick.label}
              </span>
            )}
            <span
              className={cn(
                "block w-px",
                tick.label ? "h-2 bg-muted-foreground/60" : "h-1 bg-border"
              )}
            />
          </div>
        ))}
        <div
          className="absolute inset-y-0 w-px bg-playhead"
          style={{ left: percent(ratio(displayFrame)) }}
        />
        <div
          className="absolute top-0.5 -translate-x-1/2 rounded-sm bg-playhead px-1 font-mono text-[10px] leading-4 text-white tabular-nums shadow"
          style={{ left: percent(ratio(displayFrame)) }}
        >
          {displayFrame}
        </div>
      </div>
    </div>
  );
}

function useIsSelected(target: StudioSelection) {
  const key = selectionKey(target);
  return useStudioStore(
    (s) => s.selection !== null && selectionKey(s.selection) === key
  );
}

function mergeMarkers(group: TimelineGroup): KeyframeMarker[] {
  const byFrame = new Map<number, KeyframeMarker>();
  for (const row of group.rows) {
    for (const marker of row.keyframes) {
      if (!byFrame.has(marker.frame)) byFrame.set(marker.frame, marker);
    }
  }
  return [...byFrame.values()].sort((a, b) => a.frame - b.frame);
}

function TimelineGroupRows({
  clip,
  group,
  ratio,
}: {
  clip: ClipSpec;
  group: TimelineGroup;
  ratio: FrameRatio;
}) {
  const isSelected = useIsSelected(group.target);
  const setSelection = useStudioStore((s) => s.setSelection);
  const select = () => setSelection(group.target);
  const summary = useMemo(() => mergeMarkers(group), [group]);

  return (
    <>
      <RowLabel
        level="group"
        icon={selectionIcon(clip, group.target)}
        label={group.label}
        selected={isSelected}
        onClick={select}
      />
      <TrackCell level="group" selected={isSelected}>
        <KeyframeTrack
          markers={summary}
          ratio={ratio}
          onSelect={select}
          compact
        />
      </TrackCell>
      {group.rows.map((row) => (
        <Fragment key={row.key}>
          <RowLabel
            level="property"
            label={row.property}
            selected={isSelected}
            onClick={select}
          />
          <TrackCell level="property" selected={isSelected}>
            <KeyframeTrack
              markers={row.keyframes}
              ratio={ratio}
              onSelect={select}
            />
          </TrackCell>
        </Fragment>
      ))}
    </>
  );
}

function AudioRows({ rows, ratio }: { rows: AudioRow[]; ratio: FrameRatio }) {
  return (
    <>
      <RowLabel level="group" icon={audioIcon} label="เสียง" />
      <TrackCell level="group" />
      {rows.map((row) => (
        <AudioRowItem key={row.key} row={row} ratio={ratio} />
      ))}
    </>
  );
}

function AudioRowItem({ row, ratio }: { row: AudioRow; ratio: FrameRatio }) {
  const isSelected = useIsSelected(row.target);
  const setSelection = useStudioStore((s) => s.setSelection);
  const start = ratio(row.startFrame);
  const end = row.endFrame === null ? 1 : ratio(row.endFrame);

  return (
    <>
      <RowLabel
        level="property"
        label={row.label}
        selected={isSelected}
        onClick={() => setSelection(row.target)}
      />
      <TrackCell level="property" selected={isSelected}>
        <div className="relative h-full">
          <div
            className={cn(
              "absolute inset-y-1 rounded-sm border border-primary/40 bg-primary/15",
              row.endFrame === null &&
                "border-r-0 bg-linear-to-r from-primary/20 to-transparent"
            )}
            style={{ left: percent(start), width: percent(end - start) }}
          />
        </div>
      </TrackCell>
    </>
  );
}

function RowLabel({
  level,
  icon: Icon,
  label,
  selected = false,
  onClick,
}: {
  level: "group" | "property";
  icon?: LucideIcon;
  label: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    "flex min-w-0 items-center gap-2 border-r border-b border-border/60 px-3 text-left text-xs outline-none",
    level === "group"
      ? "h-7 font-medium"
      : "h-6 pl-8 font-mono text-[11px] text-muted-foreground",
    selected && "bg-foreground/6 text-foreground",
    onClick && "hover:bg-muted/60 focus-visible:bg-muted/60"
  );
  const content = (
    <>
      {Icon && <Icon className="size-3.5 shrink-0 text-muted-foreground" />}
      <span className="truncate">{label}</span>
    </>
  );

  if (!onClick) return <div className={className}>{content}</div>;
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={className}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

function TrackCell({
  level,
  selected = false,
  children,
}: {
  level: "group" | "property";
  selected?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "border-b border-border/60 px-3",
        level === "group" ? "h-7 bg-muted/20" : "h-6",
        selected && "bg-foreground/3"
      )}
    >
      {children}
    </div>
  );
}

function KeyframeTrack({
  markers,
  ratio,
  onSelect,
  compact = false,
}: {
  markers: readonly KeyframeMarker[];
  ratio: FrameRatio;
  onSelect: () => void;
  compact?: boolean;
}) {
  const controller = useStudioController();
  const first = markers[0];
  const last = markers.at(-1);

  return (
    <div className="relative h-full">
      {first && last && markers.length > 1 && (
        <div
          className="absolute top-1/2 h-px -translate-y-1/2 bg-keyframe/35"
          style={{
            left: percent(ratio(first.frame)),
            width: percent(ratio(last.frame) - ratio(first.frame)),
          }}
        />
      )}
      {markers.map((marker) => (
        <Tooltip key={marker.frame}>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-label={`Keyframe เฟรม ${marker.frame}`}
                onClick={() => {
                  onSelect();
                  controller.seek(marker.frame);
                }}
                className={cn(
                  "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] border border-keyframe outline-none transition-transform hover:scale-125 hover:bg-keyframe focus-visible:ring-2 focus-visible:ring-ring",
                  compact ? "size-2 bg-keyframe/40" : "size-2.5 bg-keyframe/75"
                )}
                style={{ left: percent(ratio(marker.frame)) }}
              />
            }
          />
          <TooltipContent>
            เฟรม {marker.frame} · {marker.easing}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
