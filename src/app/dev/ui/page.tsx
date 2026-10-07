import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { UiGalleryLoader } from "@/features/dev/ui-gallery-loader";

export const metadata: Metadata = {
  title: "UI gallery",
};

export default function UiGalleryPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <UiGalleryLoader />;
}
