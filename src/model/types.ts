/**
 * Scene, clip and playground data model.
 *
 * A project (`src/projects/<id>/`) defines one SceneSpec, shared by its
 * playground (PlaygroundSpec) and its clip (ClipDefinition → ClipSpec).
 *
 * Everything here must stay JSON-serializable and free of React/three.js
 * imports: preview, seek and export all evaluate the same data through
 * `src/timeline/evaluate.ts`.
 */

export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type Vec3 = readonly [x: number, y: number, z: number];

export type ColorValue = string;

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
  frame: number;
  value: T;
  easing?: EasingName;
}

export interface Track<T> {
  /** Sorted by `frame` ascending. */
  keyframes: readonly Keyframe<T>[];
}

export type Animatable<T> = T | Track<T>;

export interface VideoSettings {
  width: number;
  height: number;
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

export interface MaterialSpec {
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
      size?: Vec3;
      material?: MaterialSpec;
    })
  | (SceneObjectBase & {
      kind: "model";
      src: AssetPath;
      animation?: string;
    })
  | (SceneObjectBase & {
      kind: "text";
      text: string;
      font?: AssetPath;
      fontSize?: number;
      material?: MaterialSpec;
    })
  | (SceneObjectBase & {
      kind: "custom";
      componentKey: string;
      props?: Readonly<Record<string, JsonValue>>;
    });

export interface GeoLocation {
  latitude: number;
  longitude: number;
  height?: number;
}

export interface EnvironmentSpec {
  presetId?: string;
  location?: GeoLocation;
  dateTime?: string;
  exposure?: number;
}

export interface AudioClipSpec {
  id: string;
  src: AssetPath;
  startFrame: number;
  trimStartSeconds?: number;
  durationInFrames?: number;
  volume?: Animatable<number>;
}

export interface SceneSpec {
  environment: EnvironmentSpec;
  lights: readonly LightSpec[];
  objects: readonly SceneObjectSpec[];
}

export interface ClipSpec extends SceneSpec {
  schemaVersion: 1;
  id: string;
  title: string;
  video: VideoSettings;
  seed: number;
  camera: CameraSpec;
  audio: readonly AudioClipSpec[];
}

export interface ObjectAnimation {
  transform?: Transform;
  material?: MaterialSpec;
}

export interface ClipDefinition {
  schemaVersion: 1;
  id: string;
  title: string;
  video: VideoSettings;
  seed: number;
  camera: CameraSpec;
  audio: readonly AudioClipSpec[];
  environment?: EnvironmentSpec;
  lights?: readonly LightSpec[];
  animate?: Readonly<Record<string, ObjectAnimation>>;
  extraObjects?: readonly SceneObjectSpec[];
}

export type ColliderShape = "cuboid" | "ball" | "trimesh" | "none";

export interface PlaygroundSpec {
  spawn: Vec3;
  colliders?: Readonly<Record<string, ColliderShape>>;
  extraObjects?: readonly SceneObjectSpec[];
}

export type AssetKind = "model" | "texture" | "hdri" | "audio" | "font";

export interface AssetRef {
  kind: AssetKind;
  path: AssetPath;
}
