import type { Vector3 } from "three";

import type { HullShape, Vec2, Vec3 } from "@/model/types";

import { BOAT_DEADRISE, boatHalfBeam, boatKeel } from "./shape";

export interface HullMesh {
  readonly positions: Float64Array;
  readonly indices: Uint32Array;
  readonly vertexCount: number;
  readonly triangleCount: number;
}

interface MeshBuilder {
  vertex(x: number, y: number, z: number): number;
  triangle(a: number, b: number, c: number): void;
  quad(a: number, b: number, c: number, d: number): void;
  build(): HullMesh;
}

const MIN_SEGMENTS = 3;
const MAX_SEGMENTS = 32;
const MIN_AROUND = 16;
const MAX_AROUND = 64;
const MIN_LATITUDES = 8;
const KEY_SCALE = 1e6;

export function createHullMesh(
  shape: HullShape,
  size: Vec3,
  edge: number
): HullMesh {
  const builder = createMeshBuilder();
  switch (shape) {
    case "box":
      addBox(builder, size, edge);
      break;
    case "cylinder":
      addCylinder(builder, size, edge);
      break;
    case "ellipsoid":
      addEllipsoid(builder, size, edge);
      break;
    case "boat":
      addBoat(builder, size, edge);
      break;
  }
  return builder.build();
}

export function hullReach(mesh: HullMesh, center: Vector3): number {
  const { positions } = mesh;
  let reach = 0;
  for (let index = 0; index < positions.length; index += 3) {
    reach = Math.max(
      reach,
      Math.hypot(
        positions[index] - center.x,
        positions[index + 1] - center.y,
        positions[index + 2] - center.z
      )
    );
  }
  return reach;
}

function segments(
  extent: number,
  edge: number,
  min = MIN_SEGMENTS,
  max = MAX_SEGMENTS
): number {
  return Math.min(Math.max(Math.ceil(extent / edge), min), max);
}

function addBox(
  builder: MeshBuilder,
  [beam, height, length]: Vec3,
  edge: number
): void {
  const x = beam / 2;
  const y = height / 2;
  const z = length / 2;
  const nx = segments(beam, edge);
  const ny = segments(height, edge);
  const nz = segments(length, edge);
  addFace(builder, [x, -y, -z], [0, height, 0], [0, 0, length], ny, nz);
  addFace(builder, [-x, -y, -z], [0, 0, length], [0, height, 0], nz, ny);
  addFace(builder, [-x, y, -z], [0, 0, length], [beam, 0, 0], nz, nx);
  addFace(builder, [-x, -y, -z], [beam, 0, 0], [0, 0, length], nx, nz);
  addFace(builder, [-x, -y, z], [beam, 0, 0], [0, height, 0], nx, ny);
  addFace(builder, [-x, -y, -z], [0, height, 0], [beam, 0, 0], ny, nx);
}

function addFace(
  builder: MeshBuilder,
  [ox, oy, oz]: Vec3,
  [ux, uy, uz]: Vec3,
  [vx, vy, vz]: Vec3,
  nu: number,
  nv: number
): void {
  const grid: number[] = [];
  for (let j = 0; j <= nv; j++) {
    const t = j / nv;
    for (let i = 0; i <= nu; i++) {
      const s = i / nu;
      grid.push(
        builder.vertex(
          ox + s * ux + t * vx,
          oy + s * uy + t * vy,
          oz + s * uz + t * vz
        )
      );
    }
  }
  const row = nu + 1;
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      builder.quad(
        grid[j * row + i],
        grid[j * row + i + 1],
        grid[(j + 1) * row + i + 1],
        grid[(j + 1) * row + i]
      );
    }
  }
}

function addCylinder(
  builder: MeshBuilder,
  [beam, height, length]: Vec3,
  edge: number
): void {
  const half = height / 2;
  const rings = segments(Math.min(beam, length) / 2, edge);
  const levels = segments(height, edge);
  const profile: Vec2[] = [];
  for (let index = 0; index <= rings; index++) {
    profile.push([index / rings, -half]);
  }
  for (let index = 1; index <= levels; index++) {
    profile.push([1, -half + (index / levels) * height]);
  }
  for (let index = 1; index <= rings; index++) {
    profile.push([1 - index / rings, half]);
  }
  addLathe(builder, profile, beam / 2, length / 2, around(beam, length, edge));
}

function addEllipsoid(
  builder: MeshBuilder,
  [beam, height, length]: Vec3,
  edge: number
): void {
  const count = around(beam, length, edge);
  const latitudes = Math.max(Math.ceil(count / 2), MIN_LATITUDES);
  const profile: Vec2[] = [];
  for (let index = 0; index <= latitudes; index++) {
    const angle = (Math.PI * index) / latitudes;
    profile.push([Math.sin(angle), (-height / 2) * Math.cos(angle)]);
  }
  addLathe(builder, profile, beam / 2, length / 2, count);
}

function around(beam: number, length: number, edge: number): number {
  return segments(
    (Math.PI * (beam + length)) / 2,
    edge,
    MIN_AROUND,
    MAX_AROUND
  );
}

function addLathe(
  builder: MeshBuilder,
  profile: readonly Vec2[],
  radiusX: number,
  radiusZ: number,
  count: number
): void {
  const rings = profile.map(([radius, y]) => {
    const ring: number[] = [];
    for (let index = 0; index < count; index++) {
      const angle = (2 * Math.PI * index) / count;
      ring.push(
        builder.vertex(
          radiusX * radius * Math.cos(angle),
          y,
          radiusZ * radius * Math.sin(angle)
        )
      );
    }
    return ring;
  });
  for (let j = 0; j + 1 < rings.length; j++) {
    for (let k = 0; k < count; k++) {
      const next = (k + 1) % count;
      builder.quad(
        rings[j][k],
        rings[j + 1][k],
        rings[j + 1][next],
        rings[j][next]
      );
    }
  }
}

function addBoat(builder: MeshBuilder, size: Vec3, edge: number): void {
  const [beam, height, length] = size;
  const bottom = segments(beam / 2, edge);
  const side = segments(height, edge);
  const deck = segments(beam, edge);
  const stations = segments(length, edge);
  const loops: Vec3[][] = [];
  for (let station = 0; station <= stations; station++) {
    loops.push(
      boatLoop(-1 + (2 * station) / stations, size, bottom, side, deck)
    );
  }
  const indices = loops.map((loop) =>
    loop.map(([x, y, z]) => builder.vertex(x, y, z))
  );
  const count = indices[0].length;
  for (let station = 0; station < stations; station++) {
    for (let k = 0; k < count; k++) {
      const next = (k + 1) % count;
      builder.quad(
        indices[station][k],
        indices[station][next],
        indices[station + 1][next],
        indices[station + 1][k]
      );
    }
  }
  addTransom(builder, loops[0], segments(Math.min(beam, height) / 2, edge));
}

function boatLoop(
  w: number,
  [beam, height, length]: Vec3,
  bottom: number,
  side: number,
  deck: number
): Vec3[] {
  const keel = boatKeel(w);
  const chine = keel + BOAT_DEADRISE;
  const section: Vec2[] = [[0, keel]];
  for (let index = 1; index <= bottom; index++) {
    const fraction = index / bottom;
    section.push([fraction, keel + BOAT_DEADRISE * fraction]);
  }
  for (let index = 1; index <= side; index++) {
    section.push([1, chine + ((0.5 - chine) * index) / side]);
  }
  for (let index = 1; index <= deck; index++) {
    section.push([1 - (2 * index) / deck, 0.5]);
  }
  for (let index = 1; index <= side; index++) {
    section.push([-1, 0.5 - ((0.5 - chine) * index) / side]);
  }
  for (let index = 1; index < bottom; index++) {
    const fraction = 1 - index / bottom;
    section.push([-fraction, keel + BOAT_DEADRISE * fraction]);
  }
  const halfBeam = (boatHalfBeam(w) * beam) / 2;
  const z = (w * length) / 2;
  return section.map(([fraction, y]) => [fraction * halfBeam, y * height, z]);
}

function addTransom(
  builder: MeshBuilder,
  loop: readonly Vec3[],
  rings: number
): void {
  let cx = 0;
  let cy = 0;
  for (const [x, y] of loop) {
    cx += x;
    cy += y;
  }
  cx /= loop.length;
  cy /= loop.length;
  const z = loop[0][2];
  const levels: number[][] = [];
  for (let ring = 0; ring <= rings; ring++) {
    const scale = ring / rings;
    levels.push(
      loop.map(([x, y]) =>
        builder.vertex(cx + scale * (x - cx), cy + scale * (y - cy), z)
      )
    );
  }
  const count = loop.length;
  for (let ring = 0; ring < rings; ring++) {
    for (let k = 0; k < count; k++) {
      const next = (k + 1) % count;
      builder.quad(
        levels[ring][k],
        levels[ring][next],
        levels[ring + 1][next],
        levels[ring + 1][k]
      );
    }
  }
}

function createMeshBuilder(): MeshBuilder {
  const positions: number[] = [];
  const indices: number[] = [];
  const lookup = new Map<string, number>();

  const builder: MeshBuilder = {
    vertex(x, y, z) {
      const key = `${Math.round(x * KEY_SCALE)},${Math.round(y * KEY_SCALE)},${Math.round(z * KEY_SCALE)}`;
      const found = lookup.get(key);
      if (found !== undefined) return found;
      const index = positions.length / 3;
      positions.push(x, y, z);
      lookup.set(key, index);
      return index;
    },

    triangle(a, b, c) {
      if (a === b || b === c || c === a) return;
      indices.push(a, b, c);
    },

    quad(a, b, c, d) {
      builder.triangle(a, b, c);
      builder.triangle(a, c, d);
    },

    build() {
      return {
        positions: Float64Array.from(positions),
        indices: Uint32Array.from(indices),
        vertexCount: positions.length / 3,
        triangleCount: indices.length / 3,
      };
    },
  };
  return builder;
}
