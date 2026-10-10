import type {
  ClipDefinition,
  ClipSpec,
  ObjectAnimation,
  PlaygroundSpec,
  SceneObjectSpec,
  SceneSpec,
} from "./types";

function assertUniqueIds(objects: readonly SceneObjectSpec[], context: string) {
  const seen = new Set<string>();
  for (const object of objects) {
    if (seen.has(object.id)) {
      throw new Error(`${context}: duplicate object id "${object.id}"`);
    }
    seen.add(object.id);
  }
}

function animateObject(
  object: SceneObjectSpec,
  animation: ObjectAnimation,
  clipId: string
): SceneObjectSpec {
  if (animation.transform && object.buoyancy) {
    throw new Error(
      `Clip "${clipId}": object "${object.id}" floats (buoyancy), so physics owns its transform`
    );
  }
  const transform = animation.transform
    ? { ...object.transform, ...animation.transform }
    : object.transform;

  if (!animation.material) return { ...object, transform };

  if (object.kind !== "primitive" && object.kind !== "text") {
    throw new Error(
      `Clip "${clipId}": object "${object.id}" (${object.kind}) has no material to animate`
    );
  }
  return {
    ...object,
    transform,
    material: { ...object.material, ...animation.material },
  };
}

export function composeClip(scene: SceneSpec, def: ClipDefinition): ClipSpec {
  const { animate = {}, extraObjects = [], ...clip } = def;
  const context = `Clip "${def.id}"`;

  const sceneIds = new Set(scene.objects.map((object) => object.id));
  for (const id of Object.keys(animate)) {
    if (!sceneIds.has(id)) {
      throw new Error(`${context}: animate["${id}"] matches no scene object`);
    }
  }

  const objects = [
    ...scene.objects.map((object) => {
      const animation = animate[object.id];
      return animation ? animateObject(object, animation, def.id) : object;
    }),
    ...extraObjects,
  ];
  assertUniqueIds(objects, context);

  return {
    ...clip,
    environment: { ...scene.environment, ...def.environment },
    lights: def.lights ?? scene.lights,
    objects,
  };
}

export function composePlaygroundScene(
  scene: SceneSpec,
  playground: PlaygroundSpec
): SceneSpec {
  const objects = [...scene.objects, ...(playground.extraObjects ?? [])];
  assertUniqueIds(objects, "Playground");
  return { ...scene, objects };
}
