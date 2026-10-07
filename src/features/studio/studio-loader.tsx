"use client";

import dynamic from "next/dynamic";

import type { ClipId } from "@/clips/manifest";

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

export function StudioLoader({ clipId }: { clipId: ClipId }) {
  return <StudioApp key={clipId} clipId={clipId} />;
}
