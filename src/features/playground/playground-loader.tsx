"use client";

import dynamic from "next/dynamic";

// R3F, three.js and Rapier (WASM) only run in the browser.
export const PlaygroundLoader = dynamic(
  () => import("./playground-app").then((mod) => mod.PlaygroundApp),
  {
    ssr: false,
    loading: () => (
      <p className="p-4 text-sm text-muted-foreground">กำลังโหลด Playground…</p>
    ),
  }
);
