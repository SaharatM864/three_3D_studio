import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { clipManifest, getClipMeta, isClipId } from "@/clips/manifest";
import { StudioLoader } from "@/features/studio/studio-loader";

// Only clips listed in the manifest exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return clipManifest.map((clip) => ({ clipId: clip.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/studio/[clipId]">): Promise<Metadata> {
  const { clipId } = await params;
  return isClipId(clipId) ? { title: getClipMeta(clipId).title } : {};
}

export default async function StudioClipPage({
  params,
}: PageProps<"/studio/[clipId]">) {
  const { clipId } = await params;
  if (!isClipId(clipId)) notFound();

  return <StudioLoader clipId={clipId} />;
}
