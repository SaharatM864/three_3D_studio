export type PresetId<P extends object> = Extract<keyof P, string>;

export function hasPreset<P extends object>(
  presets: P,
  id: string
): id is PresetId<P> {
  return Object.hasOwn(presets, id);
}

export function getPreset<P extends object>(
  presets: P,
  id: string,
  kind: string
): P[PresetId<P>] {
  if (!hasPreset(presets, id)) {
    throw new Error(`Unknown ${kind} preset "${id}"`);
  }
  return presets[id];
}

export function presetIds<P extends object>(presets: P): PresetId<P>[] {
  return Object.keys(presets) as PresetId<P>[];
}
