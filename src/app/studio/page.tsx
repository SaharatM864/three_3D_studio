import type { Metadata } from "next";
import Link from "next/link";

import { clipManifest } from "@/clips/manifest";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Studio",
};

export default function StudioIndexPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">คลิปทั้งหมด</h1>
        <p className="text-sm text-muted-foreground">
          เพิ่มคลิปใหม่ได้ที่ src/clips ตามคู่มือ docs/clip-authoring.md
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {clipManifest.map((clip) => (
          <Card key={clip.id}>
            <CardHeader>
              <CardTitle>{clip.title}</CardTitle>
              <CardDescription>{clip.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Link
                href={`/studio/${clip.id}`}
                className={buttonVariants({ variant: "outline" })}
              >
                เปิด
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  );
}
