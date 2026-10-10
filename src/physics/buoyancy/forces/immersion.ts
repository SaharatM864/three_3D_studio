import { Vector3 } from "three";

import type { RigidBodyState } from "../../dynamics/body-state";
import type { HullMesh } from "../hull/mesh";
import { createWaterSample, type WaterSurface } from "../water";

export interface SubmergedSurface {
  count: number;
  readonly sources: Int32Array;
  readonly vertices: Float64Array;
  readonly depths: Float64Array;
  readonly areas: Float64Array;
  readonly centroids: Float64Array;
  readonly velocities: Float64Array;
  waterlineCount: number;
  readonly waterline: Float64Array;
}

export interface Immersion {
  readonly surface: SubmergedSurface;
  update(state: RigidBodyState, water: WaterSurface): void;
}

const sample = createWaterSample();
const point = new Vector3();
const corners = new Int32Array(3);

export function createImmersion(mesh: HullMesh): Immersion {
  const { positions, indices, vertexCount, triangleCount } = mesh;
  const world = new Float64Array(vertexCount * 3);
  const heights = new Float64Array(vertexCount);
  const rising = new Float64Array(vertexCount);
  const capacity = triangleCount * 2;
  const surface: SubmergedSurface = {
    count: 0,
    sources: new Int32Array(capacity),
    vertices: new Float64Array(capacity * 9),
    depths: new Float64Array(capacity * 3),
    areas: new Float64Array(capacity * 3),
    centroids: new Float64Array(capacity * 3),
    velocities: new Float64Array(capacity * 3),
    waterlineCount: 0,
    waterline: new Float64Array(triangleCount * 6),
  };
  const piece = new Float64Array(12);
  const cut = new Float64Array(6);
  let state: RigidBodyState;

  function corner(slot: number, vertex: number): number {
    piece[slot * 3] = world[vertex * 3];
    piece[slot * 3 + 1] = world[vertex * 3 + 1];
    piece[slot * 3 + 2] = world[vertex * 3 + 2];
    piece[9 + slot] = heights[vertex];
    return rising[vertex];
  }

  function crossing(slot: number, offset: number, flow: number): number {
    piece[slot * 3] = cut[offset];
    piece[slot * 3 + 1] = cut[offset + 1];
    piece[slot * 3 + 2] = cut[offset + 2];
    piece[9 + slot] = 0;
    return flow;
  }

  function intersect(offset: number, wet: number, dry: number): number {
    const t = heights[wet] / (heights[wet] - heights[dry]);
    for (let axis = 0; axis < 3; axis++) {
      const from = world[wet * 3 + axis];
      cut[offset + axis] = from + t * (world[dry * 3 + axis] - from);
    }
    return rising[wet] + t * (rising[dry] - rising[wet]);
  }

  function addWaterline(): void {
    const offset = surface.waterlineCount * 6;
    surface.waterlineCount += 1;
    surface.waterline.set(cut, offset);
  }

  function emit(source: number, flow: number): void {
    const index = surface.count;
    surface.count += 1;
    surface.sources[index] = source;
    surface.vertices.set(piece.subarray(0, 9), index * 9);
    const offset = index * 3;
    surface.depths[offset] = -piece[9];
    surface.depths[offset + 1] = -piece[10];
    surface.depths[offset + 2] = -piece[11];

    const ex = piece[3] - piece[0];
    const ey = piece[4] - piece[1];
    const ez = piece[5] - piece[2];
    const fx = piece[6] - piece[0];
    const fy = piece[7] - piece[1];
    const fz = piece[8] - piece[2];
    surface.areas[offset] = 0.5 * (ey * fz - ez * fy);
    surface.areas[offset + 1] = 0.5 * (ez * fx - ex * fz);
    surface.areas[offset + 2] = 0.5 * (ex * fy - ey * fx);

    const cx = (piece[0] + piece[3] + piece[6]) / 3;
    const cy = (piece[1] + piece[4] + piece[7]) / 3;
    const cz = (piece[2] + piece[5] + piece[8]) / 3;
    surface.centroids[offset] = cx;
    surface.centroids[offset + 1] = cy;
    surface.centroids[offset + 2] = cz;

    const { velocity, angularVelocity: omega, position: com } = state;
    const rx = cx - com.x;
    const ry = cy - com.y;
    const rz = cz - com.z;
    surface.velocities[offset] = velocity.x + omega.y * rz - omega.z * ry;
    surface.velocities[offset + 1] =
      velocity.y + omega.z * rx - omega.x * rz - flow / 3;
    surface.velocities[offset + 2] = velocity.z + omega.x * ry - omega.y * rx;
  }

  return {
    surface,

    update(next, water) {
      state = next;
      const com = state.localCenterOfMass;
      for (let vertex = 0; vertex < vertexCount; vertex++) {
        const offset = vertex * 3;
        point
          .set(
            positions[offset] - com.x,
            positions[offset + 1] - com.y,
            positions[offset + 2] - com.z
          )
          .applyQuaternion(state.orientation)
          .add(state.position);
        world[offset] = point.x;
        world[offset + 1] = point.y;
        world[offset + 2] = point.z;
        water.sample(point.x, point.z, sample);
        heights[vertex] = point.y - sample.height;
        rising[vertex] = sample.verticalVelocity;
      }

      surface.count = 0;
      surface.waterlineCount = 0;
      for (let triangle = 0; triangle < triangleCount; triangle++) {
        const base = triangle * 3;
        let wet = 0;
        for (let slot = 0; slot < 3; slot++) {
          if (heights[indices[base + slot]] < 0) wet += 1;
        }
        if (wet === 0) continue;

        let lead = 0;
        for (let slot = 0; slot < 3; slot++) {
          const submerged = heights[indices[base + slot]] < 0;
          if (submerged === (wet !== 2)) lead = slot;
        }
        corners[0] = indices[base + lead];
        corners[1] = indices[base + ((lead + 1) % 3)];
        corners[2] = indices[base + ((lead + 2) % 3)];
        const [a, b, c] = corners;

        if (wet === 3) {
          emit(triangle, corner(0, a) + corner(1, b) + corner(2, c));
          continue;
        }

        if (wet === 1) {
          const ab = intersect(0, a, b);
          const ac = intersect(3, a, c);
          addWaterline();
          emit(
            triangle,
            corner(0, a) + crossing(1, 0, ab) + crossing(2, 3, ac)
          );
          continue;
        }

        const ca = intersect(0, c, a);
        const ba = intersect(3, b, a);
        addWaterline();
        emit(triangle, corner(0, b) + corner(1, c) + crossing(2, 0, ca));
        emit(triangle, corner(0, b) + crossing(1, 0, ca) + crossing(2, 3, ba));
      }
    },
  };
}
