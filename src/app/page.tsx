import { Clapperboard, Gamepad2 } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { projectManifest } from "@/projects/manifest";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          3D Clip Studio
        </h1>
        <p className="text-muted-foreground">
          แต่ละ project มีฉากเดียวกันให้เดินดูแสง สี และวัสดุใน Playground
          และตัดต่อเป็นคลิป MP4 ใน Studio เพิ่ม project ใหม่ได้ที่ src/projects
          ตามคู่มือ docs/project-authoring.md
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {projectManifest.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
              <CardDescription>{project.description}</CardDescription>
            </CardHeader>
            <CardFooter className="gap-2">
              <Link
                href={`/projects/${project.id}/studio`}
                className={buttonVariants()}
              >
                <Clapperboard />
                Studio
              </Link>
              <Link
                href={`/projects/${project.id}/play`}
                className={buttonVariants({ variant: "outline" })}
              >
                <Gamepad2 />
                Playground
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
