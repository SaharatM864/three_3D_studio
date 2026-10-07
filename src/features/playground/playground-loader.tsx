"use client";

import dynamic from "next/dynamic";

import { LoadingScreen } from "@/components/status-screen";
import type { ProjectId } from "@/projects/manifest";

// R3F, three.js and Rapier (WASM) only run in the browser.
const PlaygroundApp = dynamic(
  () => import("./playground-app").then((mod) => mod.PlaygroundApp),
  {
    ssr: false,
    loading: () => (
      <LoadingScreen label="กำลังโหลด Playground…" className="h-dvh bg-black" />
    ),
  }
);

export function PlaygroundLoader({ projectId }: { projectId: ProjectId }) {
  return <PlaygroundApp key={projectId} projectId={projectId} />;
}
