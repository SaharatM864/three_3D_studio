"use client";

import dynamic from "next/dynamic";

import { LoadingScreen } from "@/components/status-screen";

const UiGallery = dynamic(
  () => import("./ui-gallery").then((mod) => mod.UiGallery),
  {
    ssr: false,
    loading: () => <LoadingScreen label="กำลังโหลด UI gallery…" />,
  }
);

export function UiGalleryLoader() {
  return <UiGallery />;
}
