import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlaygroundLoader } from "@/features/playground/playground-loader";
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
}: PageProps<"/projects/[projectId]/play">): Promise<Metadata> {
  const { projectId } = await params;
  return isProjectId(projectId)
    ? { title: `${getProjectMeta(projectId).title} · Playground` }
    : {};
}

export default async function ProjectPlayPage({
  params,
}: PageProps<"/projects/[projectId]/play">) {
  const { projectId } = await params;
  if (!isProjectId(projectId)) notFound();

  return <PlaygroundLoader projectId={projectId} />;
}
