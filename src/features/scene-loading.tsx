import { useState } from "react";

import { LoadingScreen } from "@/components/status-screen";
import { cn } from "@/lib/utils";
import type { SceneLoadState, SceneLoadStep } from "@/scene/canvas/scene-load";

export type LoadingStep = "app" | "module" | SceneLoadStep;

const LOADING_STEPS: readonly LoadingStep[] = [
  "app",
  "module",
  "renderer",
  "assets",
  "compile",
  "warmup",
];

const LOADING_LABELS: Record<LoadingStep, string> = {
  app: "กำลังโหลดโปรแกรม…",
  module: "กำลังโหลดฉาก…",
  renderer: "กำลังเตรียม GPU…",
  assets: "กำลังโหลดไฟล์ของฉาก…",
  compile: "กำลังคอมไพล์ shader และคำนวณท้องฟ้า…",
  warmup: "กำลังเตรียมภาพ…",
};

export function sceneLoadingStep(state: SceneLoadState): SceneLoadStep | null {
  return state.status === "loading" ? state.step : null;
}

export function SceneLoadingOverlay({
  step,
  className,
}: {
  step: LoadingStep | null;
  className?: string;
}) {
  const [shownStep, setShownStep] = useState<LoadingStep>(step ?? "warmup");
  if (step !== null && step !== shownStep) setShownStep(step);

  const hidden = step === null;
  const progress = hidden
    ? 1
    : (LOADING_STEPS.indexOf(shownStep) + 1) / (LOADING_STEPS.length + 1);

  return (
    <div
      data-hidden={hidden || undefined}
      aria-hidden={hidden || undefined}
      className={cn(
        "absolute inset-0 grid place-items-center bg-black transition-[opacity,visibility] duration-500 data-hidden:invisible data-hidden:opacity-0 motion-reduce:transition-none",
        className
      )}
    >
      <LoadingScreen label={LOADING_LABELS[shownStep]} progress={progress} />
    </div>
  );
}
