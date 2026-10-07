"use client";

import dynamic from "next/dynamic";

import type { ProjectId } from "@/projects/manifest";

// R3F, three.js and Rapier (WASM) only run in the browser.
const PlaygroundApp = dynamic(
  () => import("./playground-app").then((mod) => mod.PlaygroundApp),
  {
    ssr: false,
    loading: () => (
      <p className="p-4 text-sm text-muted-foreground">กำลังโหลด Playground…</p>
    ),
  }
);

export function PlaygroundLoader({ projectId }: { projectId: ProjectId }) {
  return <PlaygroundApp key={projectId} projectId={projectId} />;
}
