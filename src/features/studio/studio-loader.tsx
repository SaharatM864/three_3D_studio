"use client";

import dynamic from "next/dynamic";

import { LoadingScreen } from "@/components/status-screen";
import type { ProjectId } from "@/projects/manifest";

// R3F, three.js and WebCodecs only run in the browser.
const StudioApp = dynamic(
  () => import("./studio-app").then((mod) => mod.StudioApp),
  {
    ssr: false,
    loading: () => (
      <LoadingScreen label="กำลังโหลด Studio…" className="h-dvh" />
    ),
  }
);

export function StudioLoader({ projectId }: { projectId: ProjectId }) {
  return <StudioApp key={projectId} projectId={projectId} />;
}
