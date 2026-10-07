import type { ClipModule } from "@/clips/define-clip";
import { ClipCanvas } from "@/scene/clip-canvas";
import { SceneRoot } from "@/scene/scene-root";

export function Viewport({ clip }: { clip: ClipModule }) {
  return (
    <ClipCanvas
      video={clip.project.video}
      className="w-full overflow-hidden rounded-lg bg-black"
    >
      <SceneRoot clip={clip} />
    </ClipCanvas>
  );
}
