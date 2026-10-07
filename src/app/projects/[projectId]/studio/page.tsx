import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StudioLoader } from "@/features/studio/studio-loader";
import {
  getProjectMeta,
  isProjectId,
  projectManifest,
} from "@/projects/manifest";

export const dynamicParams = false;

export function generateStaticParams() {
  return projectManifest.map((project) => ({ projectId: project.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[projectId]/studio">): Promise<Metadata> {
  const { projectId } = await params;
  return isProjectId(projectId)
    ? { title: `${getProjectMeta(projectId).title} · Studio` }
    : {};
}

export default async function ProjectStudioPage({
  params,
}: PageProps<"/projects/[projectId]/studio">) {
  const { projectId } = await params;
  if (!isProjectId(projectId)) notFound();

  return <StudioLoader projectId={projectId} />;
}
