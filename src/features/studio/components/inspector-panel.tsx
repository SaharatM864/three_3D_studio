import { Placeholder } from "@/components/placeholder";
import type { ClipSpec } from "@/model/types";

// TODO(M2): show evaluated values of the selected object at the current frame.
export function InspectorPanel({ clip }: { clip: ClipSpec }) {
  return (
    <Placeholder title="Inspector" milestone="M2">
      <ul className="flex flex-col gap-1 font-mono text-xs">
        {clip.objects.map((object) => (
          <li key={object.id}>
            {object.id} <span className="opacity-60">({object.kind})</span>
          </li>
        ))}
      </ul>
    </Placeholder>
  );
}
