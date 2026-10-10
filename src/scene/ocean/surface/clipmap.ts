import { BufferAttribute, BufferGeometry, Sphere, Vector3 } from "three";

import { CAMERA_DEFAULTS, type OceanGridSettings } from "../../render-config";
import {
  CLIPMAP_MAX_LEVELS,
  CLIPMAP_MORPH_END,
  CLIPMAP_MORPH_START,
} from "./constants";
import type { ClipmapUniforms } from "./uniforms";

export interface ClipmapLayout extends OceanGridSettings {
  readonly holeHalfCells: number;
  readonly halfExtent: number;
}

export function resolveClipmapLayout({
  baseSpacing,
  resolution,
  levels,
}: OceanGridSettings): ClipmapLayout {
  if (!(baseSpacing > 0)) {
    throw new Error(
      `Invalid ocean clipmap spacing ${baseSpacing}: must be positive`
    );
  }
  if (
    !Number.isInteger(resolution) ||
    resolution % 4 !== 0 ||
    CLIPMAP_MORPH_START < 0.5 + 0.5 / resolution ||
    CLIPMAP_MORPH_END > 1 - 6 / resolution
  ) {
    throw new Error(
      `Invalid ocean clipmap resolution ${resolution}: must be a multiple of 4 that keeps the morph band inside the level overlap`
    );
  }
  if (!Number.isInteger(levels) || levels < 1 || levels > CLIPMAP_MAX_LEVELS) {
    throw new Error(
      `Invalid ocean clipmap levels ${levels}: must be an integer from 1 to ${CLIPMAP_MAX_LEVELS}`
    );
  }
  const halfExtent = resolution * baseSpacing * 2 ** (levels - 1);
  if (halfExtent * Math.SQRT2 >= CAMERA_DEFAULTS.far) {
    throw new Error(
      `Invalid ocean clipmap reach ${halfExtent} m: its corners pass the camera far plane`
    );
  }
  return {
    baseSpacing,
    resolution,
    levels,
    holeHalfCells: resolution / 2 - 2,
    halfExtent,
  };
}

export function createClipmapGeometry({
  resolution,
  levels,
  holeHalfCells,
  halfExtent,
}: ClipmapLayout): BufferGeometry {
  const side = 2 * resolution + 1;
  const ringVertices = side * side - (2 * holeHalfCells - 1) ** 2;
  const ringCells = (2 * resolution) ** 2 - (2 * holeHalfCells) ** 2;
  const vertexCount = side * side + (levels - 1) * ringVertices;
  const cellCount = (2 * resolution) ** 2 + (levels - 1) * ringCells;

  const positions = new Float32Array(vertexCount * 3);
  const indices = new Uint32Array(cellCount * 6);
  const slots = new Int32Array(side * side);
  const slot = (i: number, j: number) =>
    slots[(j + resolution) * side + i + resolution];

  let vertex = 0;
  let cursor = 0;
  for (let level = 0; level < levels; level++) {
    const hole = level === 0 ? 0 : holeHalfCells;
    slots.fill(-1);
    for (let j = -resolution; j <= resolution; j++) {
      for (let i = -resolution; i <= resolution; i++) {
        if (Math.abs(i) < hole && Math.abs(j) < hole) continue;
        slots[(j + resolution) * side + i + resolution] = vertex;
        positions[vertex * 3] = i;
        positions[vertex * 3 + 1] = j;
        positions[vertex * 3 + 2] = level;
        vertex++;
      }
    }
    for (let j = -resolution; j < resolution; j++) {
      for (let i = -resolution; i < resolution; i++) {
        if (i >= -hole && i < hole && j >= -hole && j < hole) continue;
        const a = slot(i, j);
        const b = slot(i + 1, j);
        const c = slot(i + 1, j + 1);
        const d = slot(i, j + 1);
        indices[cursor++] = a;
        indices[cursor++] = b;
        indices[cursor++] = c;
        indices[cursor++] = a;
        indices[cursor++] = c;
        indices[cursor++] = d;
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setIndex(new BufferAttribute(indices, 1));
  geometry.boundingSphere = new Sphere(new Vector3(), halfExtent * Math.SQRT2);
  return geometry;
}

export function applyClipmapLayout(
  clipmap: ClipmapUniforms,
  { baseSpacing, resolution }: ClipmapLayout
): void {
  clipmap.baseSpacing.value = baseSpacing;
  clipmap.resolution.value = resolution;
}

export function snapClipmap(
  { baseSpacing, levels }: ClipmapLayout,
  cameraX: number,
  cameraZ: number,
  clipmap: ClipmapUniforms
): void {
  const originX = snap(cameraX, baseSpacing * 2);
  const originZ = snap(cameraZ, baseSpacing * 2);
  clipmap.origin.value.set(originX, originZ);
  clipmap.viewer.value.set(cameraX - originX, cameraZ - originZ);
  for (let level = 0; level < levels; level++) {
    const step = baseSpacing * 2 ** (level + 1);
    clipmap.levelOffsetValues[level].set(
      snap(cameraX, step) - originX,
      snap(cameraZ, step) - originZ
    );
  }
}

function snap(value: number, step: number): number {
  return Math.round(value / step) * step;
}
