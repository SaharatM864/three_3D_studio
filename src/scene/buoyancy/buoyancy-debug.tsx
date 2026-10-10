import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  InstancedMesh,
  LineSegments,
  Matrix4,
  SphereGeometry,
} from "three";
import { LineBasicNodeMaterial, MeshBasicNodeMaterial } from "three/webgpu";

import { useRenderActivity } from "../canvas/render-activity";
import { PHYSICS_DEBUG_PRIORITY } from "../render-config";
import { useDisposable } from "../use-disposable";
import { useBuoyancy } from "./buoyancy";
import {
  DebugLine,
  DebugMarker,
  type BuoyancyDebugData,
} from "./create-buoyancy";

const LINE_CAPACITY = 32768;
const MARKER_CAPACITY = 256;
const POINT_CAPACITY = 4096;
const MARKER_RADIUS = 0.12;
const POINT_RADIUS = 0.04;
const POINT_LIFT = 0.02;
const DEBUG_RENDER_ORDER = 2;

const LINE_COLORS: Readonly<Record<number, Color>> = {
  [DebugLine.wetted]: new Color("#ff8a00"),
  [DebugLine.waterline]: new Color("#ffffff"),
  [DebugLine.buoyancy]: new Color("#4ade80"),
  [DebugLine.hydrodynamic]: new Color("#ff3df2"),
};
const MARKER_COLORS: Readonly<Record<number, Color>> = {
  [DebugMarker.mass]: new Color("#ff3b30"),
  [DebugMarker.buoyancy]: new Color("#4ade80"),
};
const SURFACE = new Color("#00e5ff");

export function BuoyancyDebug() {
  const system = useBuoyancy();
  const activity = useRenderActivity();
  const debug = useMemo(() => createDebugObjects(), []);
  useDisposable(debug);

  useFrame(() => {
    if (system === null) return;
    system.readDebug(debug.data);
    debug.update();
    activity.wake();
  }, PHYSICS_DEBUG_PRIORITY);

  return (
    <>
      <primitive object={debug.lines} />
      <primitive object={debug.markers} />
      <primitive object={debug.points} />
    </>
  );
}

function createDebugObjects() {
  const data: BuoyancyDebugData = {
    lines: new Float32Array(LINE_CAPACITY * 6),
    lineKinds: new Uint8Array(LINE_CAPACITY),
    lineCount: 0,
    markers: new Float32Array(MARKER_CAPACITY * 3),
    markerKinds: new Uint8Array(MARKER_CAPACITY),
    markerCount: 0,
    points: new Float32Array(POINT_CAPACITY * 3),
    pointCount: 0,
  };

  const lineGeometry = new BufferGeometry();
  const positions = dynamicAttribute(LINE_CAPACITY * 2);
  const colors = dynamicAttribute(LINE_CAPACITY * 2);
  lineGeometry.setAttribute("position", positions);
  lineGeometry.setAttribute("color", colors);
  lineGeometry.setDrawRange(0, 0);
  const lineMaterial = new LineBasicNodeMaterial({
    vertexColors: true,
    depthTest: false,
    depthWrite: false,
  });
  const lines = new LineSegments(lineGeometry, lineMaterial);
  lines.frustumCulled = false;
  lines.renderOrder = DEBUG_RENDER_ORDER;

  const sphere = new SphereGeometry(1, 8, 6);
  const sphereMaterial = new MeshBasicNodeMaterial({
    depthTest: false,
    depthWrite: false,
  });
  const markers = createInstances(sphere, sphereMaterial, MARKER_CAPACITY);
  const points = createInstances(sphere, sphereMaterial, POINT_CAPACITY);
  const matrix = new Matrix4();
  for (let index = 0; index < POINT_CAPACITY; index++) {
    points.setColorAt(index, SURFACE);
  }

  return {
    data,
    lines,
    markers,
    points,

    update() {
      const position = positions.array as Float32Array;
      const color = colors.array as Float32Array;
      position.set(data.lines.subarray(0, data.lineCount * 6));
      for (let index = 0; index < data.lineCount; index++) {
        const tint = LINE_COLORS[data.lineKinds[index]];
        tint.toArray(color, index * 6);
        tint.toArray(color, index * 6 + 3);
      }
      positions.needsUpdate = true;
      colors.needsUpdate = true;
      lineGeometry.setDrawRange(0, data.lineCount * 2);

      for (let index = 0; index < data.markerCount; index++) {
        const offset = index * 3;
        matrix.makeScale(MARKER_RADIUS, MARKER_RADIUS, MARKER_RADIUS);
        matrix.setPosition(
          data.markers[offset],
          data.markers[offset + 1],
          data.markers[offset + 2]
        );
        markers.setMatrixAt(index, matrix);
        markers.setColorAt(index, MARKER_COLORS[data.markerKinds[index]]);
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
      markers.count = data.markerCount;
      points.count = data.pointCount;
      markers.instanceMatrix.needsUpdate = true;
      points.instanceMatrix.needsUpdate = true;
      if (markers.instanceColor !== null) {
        markers.instanceColor.needsUpdate = true;
      }
    },

    dispose() {
      lines.removeFromParent();
      markers.removeFromParent();
      points.removeFromParent();
      lineGeometry.dispose();
      lineMaterial.dispose();
      markers.dispose();
      points.dispose();
      sphere.dispose();
      sphereMaterial.dispose();
    },
  };
}

function dynamicAttribute(vertices: number): BufferAttribute {
  const attribute = new BufferAttribute(new Float32Array(vertices * 3), 3);
  attribute.setUsage(DynamicDrawUsage);
  return attribute;
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
