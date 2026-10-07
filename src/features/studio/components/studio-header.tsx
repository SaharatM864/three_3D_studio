import {
  ArrowLeft,
  Clapperboard,
  Download,
  Gamepad2,
  RectangleHorizontal,
  RectangleVertical,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ClipSpec, VideoSettings } from "@/model/types";
import { getProjectMeta, type ProjectId } from "@/projects/manifest";

import { clipDurationSeconds, formatSeconds, isPortrait } from "../format";
import { ExportDialog } from "./export-dialog";

export function StudioHeader({
  projectId,
  clip,
}: {
  projectId: ProjectId;
  clip?: ClipSpec;
}) {
  const meta = getProjectMeta(projectId);

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-2">
      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              href="/"
              aria-label="Project ทั้งหมด"
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            />
          }
        >
          <ArrowLeft />
        </TooltipTrigger>
        <TooltipContent side="bottom">Project ทั้งหมด</TooltipContent>
      </Tooltip>
      <Separator orientation="vertical" className="data-vertical:my-3" />
      <div className="flex min-w-0 items-center gap-2 px-1">
        <Clapperboard className="size-4 shrink-0 text-muted-foreground" />
        <h1 className="truncate text-sm font-medium">{meta.title}</h1>
      </div>
      {clip && <VideoFormatBadge video={clip.video} />}
      <div className="ml-auto flex items-center gap-2">
        <Link
          href={`/projects/${projectId}/play`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Gamepad2 />
          Playground
        </Link>
        {clip ? (
          <ExportDialog clip={clip} />
        ) : (
          <Button size="sm" disabled>
            <Download />
            Export
          </Button>
        )}
      </div>
    </header>
  );
}

function VideoFormatBadge({ video }: { video: VideoSettings }) {
  const Orientation = isPortrait(video)
    ? RectangleVertical
    : RectangleHorizontal;

  return (
    <Badge variant="secondary" className="hidden font-normal md:inline-flex">
      <Orientation />
      <span className="font-mono tabular-nums">
        {video.width}×{video.height}
      </span>
      <span className="text-muted-foreground">·</span>
      <span className="font-mono tabular-nums">{video.fps} fps</span>
      <span className="text-muted-foreground">·</span>
      {formatSeconds(clipDurationSeconds(video))}
    </Badge>
  );
}
