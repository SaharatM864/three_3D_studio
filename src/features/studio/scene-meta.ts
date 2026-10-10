import {
  Box,
  Circle,
  CloudSun,
  Cylinder,
  Flashlight,
  Globe,
  Lightbulb,
  type LucideIcon,
  Music,
  Package,
  Puzzle,
  Sailboat,
  Square,
  Sun,
  SunDim,
  Torus,
  Type,
  Video,
} from "lucide-react";

import type {
  ClipSpec,
  LightSpec,
  PrimitiveShape,
  SceneObjectSpec,
} from "@/model/types";
import { environmentPresets } from "@/presets/environments";
import { materialPresets } from "@/presets/materials";
import type { StudioSelection } from "@/stores/studio-store";

export const environmentIcon = Globe;
export const cameraIcon = Video;
export const audioIcon = Music;

export const lightIcons: Record<LightSpec["kind"], LucideIcon> = {
  ambient: SunDim,
  hemisphere: CloudSun,
  directional: Sun,
  point: Lightbulb,
  spot: Flashlight,
};

const shapeIcons: Record<PrimitiveShape, LucideIcon> = {
  box: Box,
  sphere: Circle,
  plane: Square,
  cylinder: Cylinder,
  torus: Torus,
  boat: Sailboat,
};

export function objectIcon(object: SceneObjectSpec): LucideIcon {
  switch (object.kind) {
    case "primitive":
      return shapeIcons[object.shape];
    case "model":
      return Package;
    case "text":
      return Type;
    case "custom":
      return Puzzle;
  }
}

export function objectDetail(object: SceneObjectSpec): string {
  return object.kind === "primitive" ? object.shape : object.kind;
}

export function environmentPresetLabel(presetId: string | undefined) {
  if (presetId === undefined) return undefined;
  return presetId in environmentPresets
    ? environmentPresets[presetId as keyof typeof environmentPresets].label
    : presetId;
}

export function materialPresetLabel(presetId: string | undefined) {
  if (presetId === undefined) return undefined;
  return presetId in materialPresets
    ? materialPresets[presetId as keyof typeof materialPresets].label
    : presetId;
}

export function selectionIcon(
  clip: ClipSpec,
  selection: StudioSelection
): LucideIcon {
  switch (selection.kind) {
    case "environment":
      return environmentIcon;
    case "camera":
      return cameraIcon;
    case "audio":
      return audioIcon;
    case "light": {
      const light = clip.lights.find((item) => item.id === selection.id);
      return light ? lightIcons[light.kind] : Lightbulb;
    }
    case "object": {
      const object = clip.objects.find((item) => item.id === selection.id);
      return object ? objectIcon(object) : Box;
    }
  }
}
