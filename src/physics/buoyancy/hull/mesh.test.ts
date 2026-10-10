import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { HullShape, Vec3 } from "@/model/types";

import { hullMassProperties } from "./mass-properties";
import { createHullMesh, type HullMesh } from "./mesh";
import { hullSection, type HullSection } from "./shape";

const RUNABOUT: Vec3 = [2.1, 1.45, 6.5];
const SHAPES: readonly HullShape[] = ["box", "cylinder", "ellipsoid", "boat"];

function assertClosed(mesh: HullMesh): void {
  const edges = new Map<string, number>();
  const { indices } = mesh;
  for (let index = 0; index < indices.length; index += 3) {
    for (let corner = 0; corner < 3; corner++) {
      const from = indices[index + corner];
      const to = indices[index + ((corner + 1) % 3)];
      const key = `${from},${to}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  for (const [key, count] of edges) {
    const [from, to] = key.split(",");
    assert.equal(count, 1, `edge ${key} is used ${count} times`);
    assert.equal(edges.get(`${to},${from}`), 1, `edge ${key} has no twin`);
  }
}

function areaSum(mesh: HullMesh): number {
  const { positions, indices } = mesh;
  let x = 0;
  let y = 0;
  let z = 0;
  for (let index = 0; index < indices.length; index += 3) {
    const a = indices[index] * 3;
    const b = indices[index + 1] * 3;
    const c = indices[index + 2] * 3;
    const ex = positions[b] - positions[a];
    const ey = positions[b + 1] - positions[a + 1];
    const ez = positions[b + 2] - positions[a + 2];
    const fx = positions[c] - positions[a];
    const fy = positions[c + 1] - positions[a + 1];
    const fz = positions[c + 2] - positions[a + 2];
    x += ey * fz - ez * fy;
    y += ez * fx - ex * fz;
    z += ex * fy - ey * fx;
  }
  return Math.hypot(x, y, z) / 2;
}

function sectionVolume(shape: HullShape, [beam, height, length]: Vec3): number {
  const samples = 1200;
  const section: HullSection = { bottom: 0, top: 0 };
  let sum = 0;
  for (let j = 0; j < samples; j++) {
    for (let i = 0; i < samples; i++) {
      const u = -1 + (2 * (i + 0.5)) / samples;
      const w = -1 + (2 * (j + 0.5)) / samples;
      if (!hullSection(shape, u, w, section)) continue;
      sum += section.top - section.bottom;
    }
  }
  return (sum * beam * height * length) / (samples * samples);
}

describe("hull mesh", () => {
  for (const shape of SHAPES) {
    test(`${shape} is closed with outward normals`, () => {
      for (const edge of [0.05, 0.3, 2]) {
        const mesh = createHullMesh(shape, RUNABOUT, edge);
        assertClosed(mesh);
        assert.ok(areaSum(mesh) < 1e-9, `${shape} area sum ${areaSum(mesh)}`);
        assert.ok(hullMassProperties(mesh).volume > 0);
      }
    });
  }

  test("box volume, centroid and gyration are exact", () => {
    const size: Vec3 = [2, 0.5, 3];
    const properties = hullMassProperties(createHullMesh("box", size, 0.25));
    assert.ok(Math.abs(properties.volume - 3) < 1e-12);
    assert.ok(properties.centroid.length() < 1e-12);
    const [x, y, z] = size;
    assert.ok(
      Math.abs(properties.gyration.x ** 2 - (y * y + z * z) / 12) < 1e-12
    );
    assert.ok(
      Math.abs(properties.gyration.y ** 2 - (x * x + z * z) / 12) < 1e-12
    );
    assert.ok(
      Math.abs(properties.gyration.z ** 2 - (x * x + y * y) / 12) < 1e-12
    );
    assert.ok(Math.abs(properties.area - 2 * (1 + 6 + 1.5)) < 1e-12);
  });

  test("round hulls match their analytic volume", () => {
    const [beam, height, length] = RUNABOUT;
    const cylinder = hullMassProperties(
      createHullMesh("cylinder", RUNABOUT, 0.05)
    ).volume;
    const ellipsoid = hullMassProperties(
      createHullMesh("ellipsoid", RUNABOUT, 0.05)
    ).volume;
    const disc = (Math.PI * beam * length) / 4;
    assert.ok(Math.abs(cylinder / (disc * height) - 1) < 0.005);
    assert.ok(Math.abs(ellipsoid / ((2 / 3) * disc * height) - 1) < 0.01);
  });

  test("boat volume matches its section integral", () => {
    const mesh = createHullMesh("boat", RUNABOUT, 0.05);
    const volume = hullMassProperties(mesh).volume;
    const expected = sectionVolume("boat", RUNABOUT);
    assert.ok(
      Math.abs(volume / expected - 1) < 0.01,
      `mesh ${volume} m³, section ${expected} m³`
    );
  });
});
