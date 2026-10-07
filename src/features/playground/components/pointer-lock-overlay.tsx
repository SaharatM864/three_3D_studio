import { MousePointerClick } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ControlsHelp } from "./controls-help";

export function PointerLockOverlay({ onStart }: { onStart?: () => void }) {
  return (
    <div
      className="absolute inset-0 grid place-items-center bg-black/45 p-4 backdrop-blur-[2px] data-interactive:cursor-pointer"
      data-interactive={onStart ? "" : undefined}
      onClick={onStart}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border bg-background/90 p-6 text-center shadow-2xl">
        <div className="grid size-11 place-items-center rounded-full bg-muted">
          <MousePointerClick className="size-5" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-medium">คลิกเพื่อเริ่มเดิน</p>
          <p className="text-xs text-muted-foreground">
            เมาส์จะถูกล็อกไว้กับฉากเพื่อหันมอง กด Esc เมื่อต้องการปล่อย
          </p>
        </div>
        <ControlsHelp className="w-full rounded-lg bg-muted/40 p-3 text-left" />
        <Button disabled={!onStart}>เริ่มเดิน</Button>
      </div>
    </div>
  );
}

export function Crosshair() {
  return (
    <>
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-1.5 -translate-1/2 rounded-full bg-white/90 ring-2 ring-black/40" />
      <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white/80">
        กด Esc เพื่อปล่อยเมาส์
      </p>
    </>
  );
}
