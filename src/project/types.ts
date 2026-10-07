/**
 * Clip project data model.
 *
 * Everything here must stay JSON-serializable and free of React/three.js
 * imports: preview, seek and export all evaluate the same data through
 * `src/timeline/evaluate.ts`.
 */

export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type Vec3 = readonly [x: number, y: number, z: number];

/** CSS color string, e.g. "#ffffff". */
export type ColorValue = string;

/** Path under `public/assets/`, e.g. "models/chair.glb". */
export type AssetPath = string;

export type EasingName =
  | "linear"
  | "step"
  | "easeInQuad"
  | "easeOutQuad"
  | "easeInOutQuad"
  | "easeInCubic"
  | "easeOutCubic"
  | "easeInOutCubic";

export interface Keyframe<T> {
  /** Integer frame index. */
  frame: number;
  value: T;
  /** Easing from this keyframe to the next one. Defaults to "linear". */
  easing?: EasingName;
}

export interface Track<T> {
  /** Sorted by `frame` ascending. */
  keyframes: readonly Keyframe<T>[];
}

/** A static value, or a keyframed track evaluated per frame. */
export type Animatable<T> = T | Track<T>;

export interface VideoSettings {
  width: number;
  height: number;
  /** Constant frame rate. */
  fps: number;
  durationInFrames: number;
}

export interface Transform {
  position?: Animatable<Vec3>;
  /** Euler angles in radians, XYZ order. */
  rotation?: Animatable<Vec3>;
  scale?: Animatable<Vec3>;
}

export interface CameraSpec {
  position: Animatable<Vec3>;
  target: Animatable<Vec3>;
  /** Vertical field of view in degrees. */
  fov: Animatable<number>;
  near?: number;
  far?: number;
}

interface LightBase {
  id: string;
  color?: Animatable<ColorValue>;
  intensity: Animatable<number>;
}

export type LightSpec =
  | (LightBase & { kind: "ambient" })
  | (LightBase & { kind: "hemisphere"; groundColor?: ColorValue })
  | (LightBase & {
      kind: "directional";
      position: Animatable<Vec3>;
      target?: Animatable<Vec3>;
      castShadow?: boolean;
    })
  | (LightBase & {
      kind: "point";
      position: Animatable<Vec3>;
      distance?: number;
      decay?: number;
      castShadow?: boolean;
    })
  | (LightBase & {
      kind: "spot";
      position: Animatable<Vec3>;
      target?: Animatable<Vec3>;
      /** Cone angle in radians. */
      angle?: number;
      penumbra?: number;
      castShadow?: boolean;
    });

export interface MaterialMaps {
  color?: AssetPath;
  normal?: AssetPath;
  roughness?: AssetPath;
  metalness?: AssetPath;
  ao?: AssetPath;
  emissive?: AssetPath;
}

/** PBR material. Fields override the preset named by `presetId`. */
export interface MaterialSpec {
  /** Key of `materialPresets` in src/presets/materials.ts. */
  presetId?: string;
  color?: Animatable<ColorValue>;
  metalness?: Animatable<number>;
  roughness?: Animatable<number>;
  emissive?: ColorValue;
  emissiveIntensity?: Animatable<number>;
  opacity?: Animatable<number>;
  maps?: MaterialMaps;
}

export type PrimitiveShape = "box" | "sphere" | "plane" | "cylinder" | "torus";

interface SceneObjectBase {
  id: string;
  transform?: Transform;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export type SceneObjectSpec =
  | (SceneObjectBase & {
      kind: "primitive";
      shape: PrimitiveShape;
      /** Shape dimensions before `transform.scale`. Defaults to [1, 1, 1]. */
      size?: Vec3;
      material?: MaterialSpec;
    })
  | (SceneObjectBase & {
      kind: "model";
      src: AssetPath;
      /** GLB animation clip, driven with AnimationMixer.setTime(). */
      animation?: string;
    })
  | (SceneObjectBase & {
      kind: "text";
      text: string;
      /** Font file; Thai text needs a font that contains Thai glyphs. */
      font?: AssetPath;
      fontSize?: number;
      material?: MaterialSpec;
    })
  | (SceneObjectBase & {
      kind: "custom";
      /** Key into the clip module's `components`. */
      componentKey: string;
      props?: Readonly<Record<string, JsonValue>>;
    });

/** Fields override the preset named by `presetId`. */
export interface EnvironmentSpec {
  /** Key of `environmentPresets` in src/presets/environments.ts. */
  presetId?: string;
  /** Opaque background color; exports are SDR with no alpha. */
  background?: ColorValue;
  hdri?: AssetPath;
  /** Show the HDRI as the background instead of `background`. */
  hdriAsBackground?: boolean;
  environmentIntensity?: number;
  fog?: { color: ColorValue; near: number; far: number };
  /** Renderer tone mapping exposure. */
  exposure?: number;
}

export interface AudioClipSpec {
  id: string;
  src: AssetPath;
  /** Timeline frame at which this clip starts playing. */
  startFrame: number;
  /** Seconds skipped from the start of the source file. */
  trimStartSeconds?: number;
  /** Length on the timeline. Defaults to the rest of the source. */
  durationInFrames?: number;
  volume?: Animatable<number>;
}

export interface ClipProject {
  schemaVersion: 1;
  id: string;
  title: string;
  video: VideoSettings;
  /** Seed for createSeededRandom() so procedural content repeats exactly. */
  seed: number;
  environment: EnvironmentSpec;
  camera: CameraSpec;
  lights: readonly LightSpec[];
  objects: readonly SceneObjectSpec[];
  audio: readonly AudioClipSpec[];
}

export type AssetKind = "model" | "texture" | "hdri" | "audio" | "font";

export interface AssetRef {
  kind: AssetKind;
  path: AssetPath;
}
