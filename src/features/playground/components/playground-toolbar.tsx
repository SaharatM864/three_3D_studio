import { ArrowLeft, Clapperboard, Gamepad2 } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getProjectMeta, type ProjectId } from "@/projects/manifest";

import { floatingPanelClass } from "./panel-controls";
import { SettingsDialog } from "./settings-dialog";

export function PlaygroundToolbar({
  projectId,
  hidden = false,
}: {
  projectId: ProjectId;
  hidden?: boolean;
}) {
  const meta = getProjectMeta(projectId);

  return (
    <div
      data-hidden={hidden || undefined}
      className={cn(
        "absolute top-3 left-3 flex items-center gap-1 p-1",
        floatingPanelClass
      )}
    >
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
      <div className="flex min-w-0 items-center gap-2 px-2">
        <Gamepad2 className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm font-medium">{meta.title}</span>
      </div>
      <Separator orientation="vertical" className="data-vertical:my-1.5" />
      <Link
        href={`/projects/${projectId}/studio`}
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <Clapperboard />
        Studio
      </Link>
      <Separator orientation="vertical" className="data-vertical:my-1.5" />
      <SettingsDialog />
    </div>
  );
}
