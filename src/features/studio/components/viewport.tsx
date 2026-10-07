import type { ClipModule } from "@/projects/define";
import { ClipCanvas } from "@/scene/clip-canvas";
import { SceneRoot } from "@/scene/scene-root";

export function Viewport({ clip }: { clip: ClipModule }) {
  return (
    <ClipCanvas
      video={clip.spec.video}
      className="w-full overflow-hidden rounded-lg bg-black"
    >
      <SceneRoot spec={clip.spec} components={clip.components} />
    </ClipCanvas>
  );
}
