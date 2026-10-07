"use client";

import dynamic from "next/dynamic";

import type { ProjectId } from "@/projects/manifest";

// R3F, three.js and WebCodecs only run in the browser.
const StudioApp = dynamic(
  () => import("./studio-app").then((mod) => mod.StudioApp),
  {
    ssr: false,
    loading: () => (
      <p className="p-4 text-sm text-muted-foreground">กำลังโหลด Studio…</p>
    ),
  }
);

export function StudioLoader({ projectId }: { projectId: ProjectId }) {
  return <StudioApp key={projectId} projectId={projectId} />;
}
