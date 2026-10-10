"use client";

import dynamic from "next/dynamic";

import type { ProjectId } from "@/projects/manifest";

import { SceneLoadingOverlay } from "../scene-loading";

// R3F, three.js and Rapier (WASM) only run in the browser.
const PlaygroundApp = dynamic(
  () => import("./playground-app").then((mod) => mod.PlaygroundApp),
  {
    ssr: false,
    loading: () => (
      <div className="relative h-dvh bg-black">
        <SceneLoadingOverlay step="app" />
      </div>
    ),
  }
);

export function PlaygroundLoader({ projectId }: { projectId: ProjectId }) {
  return <PlaygroundApp key={projectId} projectId={projectId} />;
}
