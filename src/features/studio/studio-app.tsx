import { ArrowLeft, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { buttonVariants } from "@/components/ui/button";
import { projectLoaders } from "@/projects/loaders";
import { getProjectMeta, type ProjectId } from "@/projects/manifest";
import { useStudioStore } from "@/stores/studio-store";

import { useLazyModule } from "../use-lazy-module";
import { ExportDialog } from "./components/export-dialog";
import { InspectorPanel } from "./components/inspector-panel";
import { TimelinePanel } from "./components/timeline-panel";
import { TransportBar } from "./components/transport-bar";
import { Viewport } from "./components/viewport";

export function StudioApp({ projectId }: { projectId: ProjectId }) {
  const meta = getProjectMeta(projectId);
  const state = useLazyModule(projectLoaders[projectId].clip);
  const resetStore = useStudioStore((s) => s.reset);

  useEffect(() => resetStore(), [resetStore]);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-3 border-b px-4 py-2">
        <Link
          href="/"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft />
          Project ทั้งหมด
        </Link>
        <h1 className="font-medium">{meta.title}</h1>
        <Link
          href={`/projects/${projectId}/play`}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "ml-auto",
          })}
        >
          <Gamepad2 />
          Playground
        </Link>
      </header>

      {state.status === "ready" ? (
        <div className="grid min-h-0 flex-1 grid-cols-[1fr_18rem] grid-rows-[1fr_auto]">
          <main className="min-h-0 overflow-auto p-4">
            <Viewport clip={state.module} />
          </main>
          <aside className="row-span-2 flex flex-col gap-3 overflow-auto border-l p-4">
            <InspectorPanel clip={state.module.spec} />
            <ExportDialog clip={state.module.spec} />
          </aside>
          <footer className="flex flex-col gap-3 border-t p-4">
            <TransportBar video={state.module.spec.video} />
            <TimelinePanel clip={state.module.spec} />
          </footer>
        </div>
      ) : (
        <p className="p-4 text-sm text-muted-foreground">
          {state.status === "loading"
            ? "กำลังโหลดคลิป…"
            : `โหลดคลิปไม่สำเร็จ: ${String(state.error)}`}
        </p>
      )}
    </div>
  );
}
