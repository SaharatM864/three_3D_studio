import { Box, Clapperboard, Gamepad2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { projectManifest, type ProjectMeta } from "@/projects/manifest";

const projects: readonly ProjectMeta[] = projectManifest;

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2.5 px-6">
          <div className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <Box className="size-4" />
          </div>
          <span className="font-semibold tracking-tight">3D Clip Studio</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-12">
        <section className="flex max-w-2xl flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            สร้างคลิป 3D และ export MP4 บนเบราว์เซอร์
          </h1>
          <p className="text-muted-foreground">
            แต่ละ project มีฉากเดียวกันให้เดินดูแสง สี และวัสดุใน Playground
            แล้วตัดต่อเป็นคลิปใน Studio การ render และ encode
            ทำบนเครื่องนี้ทั้งหมด
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              Project ทั้งหมด
            </h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {projects.length} project
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <p className="mx-auto w-full max-w-6xl px-6 py-4 text-xs text-muted-foreground">
          เพิ่ม project ใหม่ที่ <code className="font-mono">src/projects</code>{" "}
          ตามคู่มือ <code className="font-mono">docs/project-authoring.md</code>
        </p>
      </footer>
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectMeta }) {
  return (
    <Card className="pt-0">
      <div className="relative aspect-video overflow-hidden border-b bg-muted">
        {project.thumbnail ? (
          <Image
            src={`/assets/${project.thumbnail}`}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center bg-radial-[circle_at_50%_120%] from-muted-foreground/25 to-transparent to-60%">
            <Box
              className="size-10 text-muted-foreground/50"
              strokeWidth={1.25}
            />
          </div>
        )}
      </div>
      <CardHeader>
        <CardTitle>{project.title}</CardTitle>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto gap-2">
        <Link
          href={`/projects/${project.id}/studio`}
          className={buttonVariants({ size: "sm" })}
        >
          <Clapperboard />
          Studio
        </Link>
        <Link
          href={`/projects/${project.id}/play`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Gamepad2 />
          Playground
        </Link>
      </CardFooter>
    </Card>
  );
}
