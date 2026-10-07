import { ArrowLeft, Clapperboard } from "lucide-react";
import Link from "next/link";

import { Placeholder } from "@/components/placeholder";
import { buttonVariants } from "@/components/ui/button";
import type { ProjectId } from "@/projects/manifest";

// TODO(G1): click-to-lock prompt, crosshair, hide hints while pointer is locked.
export function Hud({ projectId }: { projectId: ProjectId }) {
  return (
    <>
      <div className="absolute top-4 left-4 flex gap-2">
        <Link
          href="/"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          <ArrowLeft />
          Project ทั้งหมด
        </Link>
        <Link
          href={`/projects/${projectId}/studio`}
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          <Clapperboard />
          Studio
        </Link>
      </div>
      <Placeholder
        title="Controls"
        milestone="G1"
        className="absolute bottom-4 left-4 bg-background/90"
      >
        <p>WASD เดิน · Shift วิ่ง · Space กระโดด · E ใช้งาน</p>
      </Placeholder>
    </>
  );
}
