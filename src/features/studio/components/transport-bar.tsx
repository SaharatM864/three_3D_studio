import {
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  StepBack,
  StepForward,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { VideoSettings } from "@/model/types";
import { useStudioStore } from "@/stores/studio-store";

import { formatTimecode } from "../format";
import { useStudioController } from "../studio-controller";
import { useTransportShortcuts } from "../use-transport-shortcuts";

export function TransportBar({ video }: { video: VideoSettings }) {
  const controller = useStudioController();
  const displayFrame = useStudioStore((s) => s.displayFrame);
  const isPlaying = useStudioStore((s) => s.isPlaying);
  const isLooping = useStudioStore((s) => s.isLooping);
  const setLooping = useStudioStore((s) => s.setLooping);
  const lastFrame = video.durationInFrames - 1;

  useTransportShortcuts(video.durationInFrames);

  return (
    <div className="flex h-11 shrink-0 items-center gap-1 border-b px-2">
      <TransportButton
        label="ไปเฟรมแรก"
        shortcut="Home"
        onClick={() => controller.seek(0)}
      >
        <SkipBack />
      </TransportButton>
      <TransportButton
        label="ถอยหนึ่งเฟรม"
        shortcut="←"
        onClick={() => controller.step(-1)}
      >
        <StepBack />
      </TransportButton>
      <TransportButton
        label={isPlaying ? "หยุด" : "เล่น"}
        shortcut="Space"
        variant="secondary"
        size="icon"
        onClick={controller.togglePlay}
      >
        {isPlaying ? <Pause /> : <Play />}
      </TransportButton>
      <TransportButton
        label="เดินหน้าหนึ่งเฟรม"
        shortcut="→"
        onClick={() => controller.step(1)}
      >
        <StepForward />
      </TransportButton>
      <TransportButton
        label="ไปเฟรมสุดท้าย"
        shortcut="End"
        onClick={() => controller.seek(lastFrame)}
      >
        <SkipForward />
      </TransportButton>
      <Tooltip>
        <TooltipTrigger
          render={
            <Toggle
              size="sm"
              aria-label="เล่นวน"
              pressed={isLooping}
              onPressedChange={setLooping}
              className="ml-1"
            />
          }
        >
          <Repeat />
        </TooltipTrigger>
        <TooltipContent>เล่นวน</TooltipContent>
      </Tooltip>

      <Separator
        orientation="vertical"
        className="mx-2 data-vertical:my-2.5"
      />

      <div className="flex items-baseline gap-1.5 font-mono text-sm tabular-nums">
        <span>{formatTimecode(displayFrame, video.fps)}</span>
        <span className="text-xs text-muted-foreground">
          / {formatTimecode(lastFrame, video.fps)}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          เฟรม{" "}
          <span className="font-mono text-foreground tabular-nums">
            {displayFrame}
          </span>{" "}
          / <span className="font-mono tabular-nums">{lastFrame}</span>
        </span>
        <span className="font-mono tabular-nums">{video.fps} fps</span>
      </div>
    </div>
  );
}

function TransportButton({
  label,
  shortcut,
  children,
  variant = "ghost",
  size = "icon-sm",
  onClick,
}: {
  label: string;
  shortcut: string;
  children: ReactNode;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant={variant}
            size={size}
            aria-label={label}
            onClick={onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>
        {label}
        <Kbd>{shortcut}</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}
