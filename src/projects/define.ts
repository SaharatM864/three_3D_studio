import { composeClip, composePlaygroundScene } from "@/model/compose";
import type {
  ClipDefinition,
  ClipSpec,
  PlaygroundSpec,
  SceneSpec,
} from "@/model/types";
import type { SceneComponents } from "@/scene/custom-components";

export type { SceneComponentProps } from "@/scene/custom-components";

/**
 * What `src/projects/<id>/scene.tsx` default-exports: the world shared by the
 * project's playground and clip.
 *
 * `spec` is plain data. `components` holds R3F components for anything the
 * data cannot express; they must read time from useClipFrame() only.
 */
export interface SceneModule {
  spec: SceneSpec;
  components?: SceneComponents;
}

export interface ClipModule {
  spec: ClipSpec;
  components?: SceneComponents;
}

export interface PlaygroundModule {
  scene: SceneSpec;
  playground: PlaygroundSpec;
  components?: SceneComponents;
}

export interface DefineOptions {
  components?: SceneComponents;
}

export function defineScene(scene: SceneModule): SceneModule {
  return scene;
}

export function defineClip(
  scene: SceneModule,
  clip: ClipDefinition,
  options: DefineOptions = {}
): ClipModule {
  return {
    spec: composeClip(scene.spec, clip),
    components: { ...scene.components, ...options.components },
  };
}

export function definePlayground(
  scene: SceneModule,
  playground: PlaygroundSpec,
  options: DefineOptions = {}
): PlaygroundModule {
  return {
    scene: composePlaygroundScene(scene.spec, playground),
    playground,
    components: { ...scene.components, ...options.components },
  };
}
