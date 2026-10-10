import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  LineSegments,
} from "three";
import { LineBasicNodeMaterial } from "three/webgpu";

import type { DebugRenderBuffers } from "@/physics/rapier";

import { useRenderActivity } from "../canvas/render-activity";
import { PHYSICS_DEBUG_PRIORITY } from "../render-config";
import { useDisposable } from "../use-disposable";
import { usePhysics } from "./physics";

const INITIAL_VERTICES = 4096;
const DEBUG_RENDER_ORDER = 2;

export function PhysicsDebug() {
  const physics = usePhysics();
  const activity = useRenderActivity();
  const lines = useMemo(() => createDebugLines(), []);
  useDisposable(lines);

  useFrame(() => {
    if (physics === null) return;
    lines.update(physics.world.debugRender());
    activity.wake();
  }, PHYSICS_DEBUG_PRIORITY);

  return <primitive object={lines.object} />;
}

function createDebugLines() {
  const geometry = new BufferGeometry();
  const material = new LineBasicNodeMaterial({
    vertexColors: true,
    depthTest: false,
    depthWrite: false,
  });
  const object = new LineSegments(geometry, material);
  object.frustumCulled = false;
  object.renderOrder = DEBUG_RENDER_ORDER;
  let capacity = INITIAL_VERTICES;
  let positions = allocate(capacity);
  let colors = allocate(capacity);
  geometry.setAttribute("position", positions);
  geometry.setAttribute("color", colors);
  geometry.setDrawRange(0, 0);

  function reserve(vertices: number): void {
    if (vertices <= capacity) return;
    capacity = Math.max(capacity * 2, vertices);
    positions = allocate(capacity);
    colors = allocate(capacity);
    geometry.setAttribute("position", positions);
    geometry.setAttribute("color", colors);
  }

  return {
    object,

    update({ vertices, colors: rgba }: DebugRenderBuffers) {
      const count = vertices.length / 3;
      reserve(count);
      const position = positions.array as Float32Array;
      const color = colors.array as Float32Array;
      position.set(vertices);
      for (let index = 0; index < count; index++) {
        color[index * 3] = rgba[index * 4];
        color[index * 3 + 1] = rgba[index * 4 + 1];
        color[index * 3 + 2] = rgba[index * 4 + 2];
      }
      positions.needsUpdate = true;
      colors.needsUpdate = true;
      geometry.setDrawRange(0, count);
    },

    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

function allocate(vertices: number): BufferAttribute {
  const attribute = new BufferAttribute(new Float32Array(vertices * 3), 3);
  attribute.setUsage(DynamicDrawUsage);
  return attribute;
}
