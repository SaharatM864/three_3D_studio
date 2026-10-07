import { useEffect } from "react";

import { ErrorScreen, LoadingScreen } from "@/components/status-screen";
import { projectLoaders } from "@/projects/loaders";
import type { ProjectId } from "@/projects/manifest";
import { useStudioStore } from "@/stores/studio-store";

import { useLazyModule } from "../use-lazy-module";
import { InspectorPanel } from "./components/inspector-panel";
import { OutlinerPanel } from "./components/outliner-panel";
import { StudioHeader } from "./components/studio-header";
import { TimelinePanel } from "./components/timeline-panel";
import { TransportBar } from "./components/transport-bar";
import { Viewport } from "./components/viewport";
import { StudioControllerProvider } from "./studio-controller";

export function StudioApp({ projectId }: { projectId: ProjectId }) {
  const state = useLazyModule(projectLoaders[projectId].clip);
  const resetStore = useStudioStore((s) => s.reset);

  useEffect(() => resetStore(), [resetStore]);

  if (state.status !== "ready") {
    return (
      <div className="flex h-dvh flex-col">
        <StudioHeader projectId={projectId} />
        {state.status === "loading" ? (
          <LoadingScreen label="กำลังโหลดคลิป…" />
        ) : (
          <ErrorScreen
            title="โหลดคลิปไม่สำเร็จ"
            error={state.error}
            onRetry={() => window.location.reload()}
            className="flex-1"
          />
        )}
      </div>
    );
  }

  const clip = state.module;

  return (
    <StudioControllerProvider video={clip.spec.video}>
      <div className="grid h-dvh grid-rows-[auto_minmax(0,1fr)_16rem] overflow-hidden">
        <StudioHeader projectId={projectId} clip={clip.spec} />
        <div className="grid min-h-0 grid-cols-[14rem_minmax(0,1fr)_18rem]">
          <OutlinerPanel clip={clip.spec} />
          <Viewport clip={clip} />
          <InspectorPanel clip={clip.spec} />
        </div>
        <section className="flex min-h-0 flex-col border-t">
          <TransportBar video={clip.spec.video} />
          <TimelinePanel clip={clip.spec} />
        </section>
      </div>
    </StudioControllerProvider>
  );
}
