import type {
  Animatable,
  ClipSpec,
  EasingName,
  MaterialSpec,
  Transform,
} from "@/model/types";
import { selectionKey, type StudioSelection } from "@/stores/studio-store";
import { isTrack } from "@/timeline/track";

export interface KeyframeMarker {
  frame: number;
  easing: EasingName;
}

export interface KeyframeRow {
  key: string;
  property: string;
  keyframes: KeyframeMarker[];
}

export interface TimelineGroup {
  key: string;
  target: StudioSelection;
  label: string;
  rows: KeyframeRow[];
}

export interface AudioRow {
  key: string;
  target: StudioSelection;
  label: string;
  startFrame: number;
  endFrame: number | null;
}

function trackRow<T>(
  groupKey: string,
  property: string,
  value: Animatable<T> | undefined
): KeyframeRow[] {
  if (value === undefined || !isTrack(value)) return [];
  return [
    {
      key: `${groupKey}/${property}`,
      property,
      keyframes: value.keyframes.map((keyframe) => ({
        frame: keyframe.frame,
        easing: keyframe.easing ?? "linear",
      })),
    },
  ];
}

function transformRows(groupKey: string, transform?: Transform) {
  return [
    ...trackRow(groupKey, "position", transform?.position),
    ...trackRow(groupKey, "rotation", transform?.rotation),
    ...trackRow(groupKey, "scale", transform?.scale),
  ];
}

function materialRows(groupKey: string, material?: MaterialSpec) {
  return [
    ...trackRow(groupKey, "material.color", material?.color),
    ...trackRow(groupKey, "material.metalness", material?.metalness),
    ...trackRow(groupKey, "material.roughness", material?.roughness),
    ...trackRow(
      groupKey,
      "material.emissiveIntensity",
      material?.emissiveIntensity
    ),
    ...trackRow(groupKey, "material.opacity", material?.opacity),
  ];
}

export function collectTimelineGroups(clip: ClipSpec): TimelineGroup[] {
  const groups: TimelineGroup[] = [];

  function add(
    target: StudioSelection,
    label: string,
    build: (key: string) => KeyframeRow[]
  ) {
    const key = selectionKey(target);
    const rows = build(key);
    if (rows.length > 0) groups.push({ key, target, label, rows });
  }

  add({ kind: "camera" }, "กล้อง", (key) => [
    ...trackRow(key, "position", clip.camera.position),
    ...trackRow(key, "target", clip.camera.target),
    ...trackRow(key, "fov", clip.camera.fov),
  ]);

  for (const light of clip.lights) {
    add({ kind: "light", id: light.id }, light.id, (key) => [
      ...trackRow(key, "color", light.color),
      ...trackRow(key, "intensity", light.intensity),
      ...("position" in light ? trackRow(key, "position", light.position) : []),
      ...("target" in light ? trackRow(key, "target", light.target) : []),
    ]);
  }

  for (const object of clip.objects) {
    add({ kind: "object", id: object.id }, object.id, (key) => [
      ...transformRows(key, object.transform),
      ...("material" in object ? materialRows(key, object.material) : []),
    ]);
  }

  return groups;
}

export function collectAudioRows(clip: ClipSpec): AudioRow[] {
  return clip.audio.map((audio) => {
    const target: StudioSelection = { kind: "audio", id: audio.id };
    return {
      key: selectionKey(target),
      target,
      label: audio.id,
      startFrame: audio.startFrame,
      endFrame:
        audio.durationInFrames === undefined
          ? null
          : audio.startFrame + audio.durationInFrames,
    };
  });
}
