import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import type { ClipModule } from "@/clips/define-clip";
import { clipLoaders } from "@/clips/loaders";
import { getClipMeta, type ClipId } from "@/clips/manifest";

import { ExportDialog } from "./components/export-dialog";
import { InspectorPanel } from "./components/inspector-panel";
import { TimelinePanel } from "./components/timeline-panel";
import { TransportBar } from "./components/transport-bar";
import { Viewport } from "./components/viewport";

type ClipLoadState =
  | { status: "loading" }
  | { status: "ready"; clip: ClipModule }
  | { status: "error"; error: unknown };

export function StudioApp({ clipId }: { clipId: ClipId }) {
  const meta = getClipMeta(clipId);
  const [state, setState] = useState<ClipLoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    clipLoaders[clipId]().then(
      (mod) => {
        if (!cancelled) setState({ status: "ready", clip: mod.default });
      },
      (error: unknown) => {
        if (!cancelled) setState({ status: "error", error });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [clipId]);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-3 border-b px-4 py-2">
        <Link
          href="/studio"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft />
          คลิปทั้งหมด
        </Link>
        <h1 className="font-medium">{meta.title}</h1>
      </header>

      {state.status === "ready" ? (
        <div className="grid min-h-0 flex-1 grid-cols-[1fr_18rem] grid-rows-[1fr_auto]">
          <main className="min-h-0 overflow-auto p-4">
            <Viewport clip={state.clip} />
          </main>
          <aside className="row-span-2 flex flex-col gap-3 overflow-auto border-l p-4">
            <InspectorPanel project={state.clip.project} />
            <ExportDialog project={state.clip.project} />
          </aside>
          <footer className="flex flex-col gap-3 border-t p-4">
            <TransportBar video={state.clip.project.video} />
            <TimelinePanel project={state.clip.project} />
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
