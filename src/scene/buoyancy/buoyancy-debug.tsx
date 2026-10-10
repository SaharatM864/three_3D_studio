import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { Color, InstancedMesh, Matrix4, SphereGeometry } from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";

import { useRenderActivity } from "../canvas/render-activity";
import { BUOYANCY_DEBUG_PRIORITY } from "../render-config";
import { useDisposable } from "../use-disposable";
import { useBuoyancy } from "./buoyancy";
import type { BuoyancyDebugData } from "./create-buoyancy";

const PROBE_CAPACITY = 1024;
const POINT_CAPACITY = 4096;
const PROBE_RADIUS = 0.08;
const POINT_RADIUS = 0.04;
const POINT_LIFT = 0.02;
const DEBUG_RENDER_ORDER = 2;

const WET = new Color("#ff8a00");
const DRY = new Color("#ffffff");
const SURFACE = new Color("#00e5ff");

export function BuoyancyDebug() {
  const system = useBuoyancy();
  const activity = useRenderActivity();
  const debug = useMemo(() => createDebugMeshes(), []);
  useDisposable(debug);

  useFrame(() => {
    if (system === null) return;
    system.readDebug(debug.data);
    debug.update();
    activity.wake();
  }, BUOYANCY_DEBUG_PRIORITY);

  return (
    <>
      <primitive object={debug.probes} />
      <primitive object={debug.points} />
    </>
  );
}

function createDebugMeshes() {
  const data: BuoyancyDebugData = {
    probes: new Float32Array(PROBE_CAPACITY * 4),
    probeCount: 0,
    points: new Float32Array(POINT_CAPACITY * 3),
    pointCount: 0,
  };
  const geometry = new SphereGeometry(1, 8, 6);
  const material = new MeshBasicNodeMaterial({
    depthTest: false,
    depthWrite: false,
  });
  const probes = createInstances(geometry, material, PROBE_CAPACITY);
  const points = createInstances(geometry, material, POINT_CAPACITY);
  const matrix = new Matrix4();

  for (let index = 0; index < PROBE_CAPACITY; index++) {
    probes.setColorAt(index, DRY);
  }
  for (let index = 0; index < POINT_CAPACITY; index++) {
    points.setColorAt(index, SURFACE);
  }

  return {
    data,
    probes,
    points,

    update() {
      for (let index = 0; index < data.probeCount; index++) {
        const offset = index * 4;
        matrix.makeScale(PROBE_RADIUS, PROBE_RADIUS, PROBE_RADIUS);
        matrix.setPosition(
          data.probes[offset],
          data.probes[offset + 1],
          data.probes[offset + 2]
        );
        probes.setMatrixAt(index, matrix);
        probes.setColorAt(index, data.probes[offset + 3] > 0 ? WET : DRY);
      }
      for (let index = 0; index < data.pointCount; index++) {
        const offset = index * 3;
        matrix.makeScale(POINT_RADIUS, POINT_RADIUS, POINT_RADIUS);
        matrix.setPosition(
          data.points[offset],
          data.points[offset + 1] + POINT_LIFT,
          data.points[offset + 2]
        );
        points.setMatrixAt(index, matrix);
      }
      probes.count = data.probeCount;
      points.count = data.pointCount;
      probes.instanceMatrix.needsUpdate = true;
      points.instanceMatrix.needsUpdate = true;
      if (probes.instanceColor !== null) {
        probes.instanceColor.needsUpdate = true;
      }
    },

    dispose() {
      probes.removeFromParent();
      points.removeFromParent();
      probes.dispose();
      points.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}

function createInstances(
  geometry: SphereGeometry,
  material: MeshBasicNodeMaterial,
  capacity: number
): InstancedMesh {
  const mesh = new InstancedMesh(geometry, material, capacity);
  mesh.count = 0;
  mesh.frustumCulled = false;
  mesh.renderOrder = DEBUG_RENDER_ORDER;
  return mesh;
}
