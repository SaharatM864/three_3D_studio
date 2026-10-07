import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX />
          </EmptyMedia>
          <EmptyTitle>ไม่พบหน้านี้</EmptyTitle>
          <EmptyDescription>
            project หรือหน้าที่เปิดไม่มีอยู่ เลือก project จากหน้าแรกแทน
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/" className={buttonVariants({ size: "sm" })}>
            <ArrowLeft />
            กลับหน้าแรก
          </Link>
        </EmptyContent>
      </Empty>
    </main>
  );
}
