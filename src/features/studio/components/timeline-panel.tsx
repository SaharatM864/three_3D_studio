import { Placeholder } from "@/components/placeholder";
import type { ClipProject } from "@/project/types";

// TODO(M2): one row per animated property with keyframe markers and a playhead.
export function TimelinePanel({ project }: { project: ClipProject }) {
  const { durationInFrames, fps } = project.video;

  return (
    <Placeholder title="Timeline" milestone="M2">
      <p>
        {durationInFrames} เฟรม ({durationInFrames / fps} วินาที) · วัตถุ{" "}
        {project.objects.length} ชิ้น · ไฟ {project.lights.length} ดวง
      </p>
    </Placeholder>
  );
}
