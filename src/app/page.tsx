import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          3D Clip Studio
        </h1>
        <p className="text-muted-foreground">
          สร้างคลิป 3D และ export เป็น MP4 บนเบราว์เซอร์ หรือเดินในฉากเพื่อดูแสง
          สี และ texture
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Studio</CardTitle>
            <CardDescription>
              Preview คลิปที่ AI เขียนไว้ใน src/clips ปรับกล้องและแสง แล้ว
              export MP4
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/studio" className={buttonVariants()}>
              เปิด Studio
            </Link>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Playground</CardTitle>
            <CardDescription>
              เดินในฉากแบบเกมเพื่อดูแสง สี และวัสดุจาก preset ชุดเดียวกับ Studio
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/play" className={buttonVariants()}>
              เข้า Playground
            </Link>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
