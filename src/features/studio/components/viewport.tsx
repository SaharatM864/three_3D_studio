import { Box } from "lucide-react";
import { useState } from "react";

import { ErrorScreen } from "@/components/status-screen";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { ClipModule } from "@/projects/define";
import {
  INITIAL_SCENE_LOAD,
  type SceneLoadState,
} from "@/scene/canvas/scene-load";
import { ClipCanvas } from "@/scene/clip-canvas";
import { SceneRoot } from "@/scene/scene-root";

import { SceneLoadingOverlay, sceneLoadingStep } from "../../scene-loading";

export function Viewport({ clip }: { clip: ClipModule }) {
  const { width, height } = clip.spec.video;
  const [sceneLoad, setSceneLoad] =
    useState<SceneLoadState>(INITIAL_SCENE_LOAD);

  return (
    <div className="relative min-h-0 min-w-0 bg-muted/20 p-6">
      <div className="[container-type:size] grid size-full place-items-center">
        <div
          className="relative overflow-hidden rounded-md bg-black shadow-2xl ring-1 ring-border"
          style={{
            width: `min(100cqw, calc(100cqh * ${width} / ${height}))`,
            aspectRatio: `${width} / ${height}`,
          }}
        >
          <ClipCanvas
            video={clip.spec.video}
            className="size-full"
            fallback={
              <ErrorScreen
                title="เบราว์เซอร์นี้ไม่รองรับ WebGPU"
                error="เปิดหน้านี้ด้วย Chrome หรือ Edge เวอร์ชันล่าสุดบน desktop"
                className="relative z-10 h-full bg-black"
              />
            }
            onLoadChange={setSceneLoad}
          >
            <SceneRoot spec={clip.spec} components={clip.components} />
          </ClipCanvas>
          <ScenePendingOverlay />
          <SceneLoadingOverlay step={sceneLoadingStep(sceneLoad)} />
        </div>
      </div>
      <div className="pointer-events-none absolute top-2 left-2 flex gap-1.5">
        <Badge variant="secondary" className="font-normal">
          Preview
          <span className="font-mono text-muted-foreground tabular-nums">
            {width}×{height}
          </span>
        </Badge>
      </div>
    </div>
  );
}

// TODO(M1): remove once SceneRoot renders the scene.
function ScenePendingOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      <Empty className="text-white/70">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-white/10 text-white/80">
            <Box />
          </EmptyMedia>
          <EmptyTitle className="text-white/80">
            ยังไม่ได้ render ฉาก
          </EmptyTitle>
          <EmptyDescription className="text-white/50">
            ภาพจะแสดงที่นี่เมื่อเชื่อม SceneRoot กับ frame driver
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
