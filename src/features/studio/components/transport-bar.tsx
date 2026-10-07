import { Placeholder } from "@/components/placeholder";
import type { VideoSettings } from "@/project/types";
import { useStudioStore } from "@/stores/studio-store";

// TODO(M2): play/pause, frame stepping and a scrubber wired to the frame driver.
export function TransportBar({ video }: { video: VideoSettings }) {
  const displayFrame = useStudioStore((state) => state.displayFrame);

  return (
    <Placeholder title="Transport" milestone="M2">
      <p className="font-mono">
        frame {displayFrame} / {video.durationInFrames - 1} · {video.fps} fps
      </p>
    </Placeholder>
  );
}
