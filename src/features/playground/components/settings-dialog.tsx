import { RotateCcw, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePlaygroundSettingsStore } from "@/stores/playground-settings-store";

import {
  DebugSection,
  OrbitSection,
  QualitySection,
  ViewSection,
} from "./settings-sections";

export function SettingsDialog() {
  const reset = usePlaygroundSettingsStore((s) => s.reset);

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger
          render={
            <DialogTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="ตั้งค่า" />
              }
            />
          }
        >
          <Settings />
        </TooltipTrigger>
        <TooltipContent side="bottom">ตั้งค่า</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ตั้งค่า Playground</DialogTitle>
          <DialogDescription>
            ใช้กับทุก project จนกว่าจะปิดหรือ reload แท็บนี้
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="-mx-4 *:data-[slot=scroll-area-viewport]:max-h-[min(32rem,calc(100dvh-12rem))]">
          <div className="flex flex-col gap-4 px-4 pb-1">
            <QualitySection />
            <Separator />
            <ViewSection />
            <Separator />
            <OrbitSection />
            <Separator />
            <DebugSection />
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={reset}>
            <RotateCcw />
            คืนค่าเริ่มต้น
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
