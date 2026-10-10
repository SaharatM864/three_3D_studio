import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Vector3 } from "three";

import type { Vec3 } from "@/model/types";

import { GRAVITY } from "../../constants";
import { WATER_DENSITY } from "../constants";
import { analyzeHydrostatics } from "./hydrostatics";
import { createHullMesh } from "./mesh";

const WEIGHT = WATER_DENSITY * GRAVITY;

function near(actual: number, expected: number, tolerance: number): void {
  assert.ok(
    Math.abs(actual - expected) <= tolerance * Math.max(Math.abs(expected), 1),
    `${actual} != ${expected}`
  );
}

describe("hull hydrostatics", () => {
  test("a 500 kg cube floats 0.488 m deep", () => {
    const mesh = createHullMesh("box", [1, 1, 1], 0.25);
    const statics = analyzeHydrostatics(
      mesh,
      new Vector3(),
      500 / WATER_DENSITY
    );
    near(statics.height, 0.5 - 500 / WATER_DENSITY, 1e-9);
    near(statics.waterplane, 1, 1e-9);
    near(statics.heave, WEIGHT, 1e-9);
  });

  test("a box's stiffness follows its metacentric heights", () => {
    const size: Vec3 = [2.4, 1.2, 6];
    const [beam, height, length] = size;
    const com = new Vector3(0, -0.2, 0);
    const draft = 0.45;
    const volume = beam * length * draft;
    const statics = analyzeHydrostatics(
      createHullMesh("box", size, 0.3),
      com,
      volume
    );
    const keel = height / 2 + com.y;
    const transverse = draft / 2 + (beam * beam) / (12 * draft) - keel;
    const longitudinal = draft / 2 + (length * length) / (12 * draft) - keel;
    near(statics.height, keel - draft, 1e-9);
    near(statics.heave, WEIGHT * beam * length, 1e-9);
    near(statics.roll, WEIGHT * volume * transverse, 1e-3);
    near(statics.pitch, WEIGHT * volume * longitudinal, 1e-3);
  });

  test("a top-heavy box has no righting stiffness", () => {
    const statics = analyzeHydrostatics(
      createHullMesh("box", [1, 2, 4], 0.25),
      new Vector3(0, 0.4, 0),
      4
    );
    assert.equal(statics.roll, 0);
    assert.ok(statics.pitch > 0);
  });

  test("a heavier-than-water body has no waterplane", () => {
    const mesh = createHullMesh("box", [1, 1, 1], 0.25);
    const statics = analyzeHydrostatics(mesh, new Vector3(), 1);
    near(statics.waterplane, 0, 1e-9);
    assert.ok(statics.height < -0.5);
  });
});
