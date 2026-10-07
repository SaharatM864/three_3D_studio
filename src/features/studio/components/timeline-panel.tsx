import { Placeholder } from "@/components/placeholder";
import type { ClipSpec } from "@/model/types";

// TODO(M2): one row per animated property with keyframe markers and a playhead.
export function TimelinePanel({ clip }: { clip: ClipSpec }) {
  const { durationInFrames, fps } = clip.video;

  return (
    <Placeholder title="Timeline" milestone="M2">
      <p>
        {durationInFrames} เฟรม ({durationInFrames / fps} วินาที) · วัตถุ{" "}
        {clip.objects.length} ชิ้น · ไฟ {clip.lights.length} ดวง
      </p>
    </Placeholder>
  );
}
