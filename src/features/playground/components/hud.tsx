import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Placeholder } from "@/components/placeholder";
import { buttonVariants } from "@/components/ui/button";

// TODO(G1): click-to-lock prompt, crosshair, hide hints while pointer is locked.
export function Hud() {
  return (
    <>
      <Link
        href="/"
        className={buttonVariants({
          variant: "secondary",
          size: "sm",
          className: "absolute top-4 left-4",
        })}
      >
        <ArrowLeft />
        หน้าแรก
      </Link>
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
