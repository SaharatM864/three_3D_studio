import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Euler, Vector3 } from "three";

import type { HullShape, Vec3 } from "@/model/types";

import { GRAVITY } from "../../constants";
import {
  createRigidBodyState,
  type RigidBodyState,
} from "../../dynamics/body-state";
import { WATER_DENSITY } from "../constants";
import { hullMassProperties } from "../hull/mass-properties";
import { createHullMesh } from "../hull/mesh";
import { createFlatWater, type WaterSurface } from "../water";
import { createImmersion } from "./immersion";
import { applyPressure, submergedCentroid } from "./pressure";
import { createWrench } from "./wrench";

const WEIGHT = WATER_DENSITY * GRAVITY;
const SIZE: Vec3 = [2.1, 1.45, 6.5];
const SHAPES: readonly HullShape[] = ["box", "cylinder", "ellipsoid", "boat"];
const ATTITUDES: readonly Vec3[] = [
  [0, 0, 0],
  [0.3, 0, 0],
  [0, 0, 0.5],
  [0.2, 0.7, -0.4],
  [-1.1, 0.3, 0.9],
  [2.5, -0.6, 1.7],
  [Math.PI, 0, 0.2],
];
const water = createFlatWater(0);

function pose(
  height: number,
  [x, y, z]: Vec3,
  com = new Vector3()
): RigidBodyState {
  const state = createRigidBodyState();
  state.position.set(0.4, height, -0.7);
  state.orientation.setFromEuler(new Euler(x, y, z));
  state.localCenterOfMass.copy(com);
  return state;
}

function close(actual: Vector3, expected: Vector3, tolerance: number): void {
  assert.ok(
    actual.distanceTo(expected) <= tolerance,
    `${actual.toArray()} != ${expected.toArray()}`
  );
}

describe("hydrostatic pressure", () => {
  test("an upright box displaces B·L·T with its buoyancy at T/2", () => {
    const [beam, height, length] = SIZE;
    const mesh = createHullMesh("box", SIZE, 0.4);
    const immersion = createImmersion(mesh);
    const state = pose(0.2, [0, 0, 0]);
    immersion.update(state, water);
    const wrench = createWrench();
    const displaced = applyPressure(immersion.surface, state.position, wrench);
    const draft = height / 2 - 0.2;
    const volume = beam * length * draft;
    assert.ok(Math.abs(displaced - volume) < 1e-9);
    close(wrench.force, new Vector3(0, WEIGHT * volume, 0), 1e-6);
    close(wrench.torque, new Vector3(), 1e-6);
    const center = new Vector3();
    submergedCentroid(immersion.surface, center);
    close(center, new Vector3(0.4, -draft / 2, -0.7), 1e-9);
  });

  for (const shape of SHAPES) {
    test(`a submerged ${shape} feels ρgV at its centroid`, () => {
      const mesh = createHullMesh(shape, SIZE, 0.5);
      const properties = hullMassProperties(mesh);
      const immersion = createImmersion(mesh);
      const com = new Vector3(0.1, -0.3, -0.8);
      for (const attitude of ATTITUDES) {
        const state = pose(-10, attitude, com);
        immersion.update(state, water);
        const wrench = createWrench();
        applyPressure(immersion.surface, state.position, wrench);
        const lift = WEIGHT * properties.volume;
        close(wrench.force, new Vector3(0, lift, 0), lift * 1e-9);
        const arm = properties.centroid
          .clone()
          .sub(com)
          .applyQuaternion(state.orientation);
        const torque = arm.cross(new Vector3(0, lift, 0));
        close(wrench.torque, torque, lift * 1e-9);
      }
    });

    test(`a floating ${shape} pushes straight up through its centre of buoyancy`, () => {
      const mesh = createHullMesh(shape, SIZE, 0.5);
      const immersion = createImmersion(mesh);
      const com = new Vector3(0, -0.2, -0.5);
      const center = new Vector3();
      for (const attitude of ATTITUDES) {
        const state = pose(0.15, attitude, com);
        immersion.update(state, water);
        const wrench = createWrench();
        const displaced = applyPressure(
          immersion.surface,
          state.position,
          wrench
        );
        const volume = submergedCentroid(immersion.surface, center);
        assert.ok(displaced > 0);
        assert.ok(Math.abs(displaced - volume) < 1e-9 * volume);
        const lift = WEIGHT * displaced;
        close(wrench.force, new Vector3(0, lift, 0), lift * 1e-9);
        const torque = center
          .clone()
          .sub(state.position)
          .cross(new Vector3(0, lift, 0));
        close(wrench.torque, torque, lift * 1e-9);
      }
    });
  }

  test("a sloped surface pushes a submerged hull down the slope", () => {
    const slope = 0.2;
    const sloped: WaterSurface = {
      sample(x, _z, out) {
        out.height = slope * x;
        out.verticalVelocity = 0;
      },
    };
    const mesh = createHullMesh("boat", SIZE, 0.5);
    const volume = hullMassProperties(mesh).volume;
    const immersion = createImmersion(mesh);
    const state = pose(-10, [0.4, 0.3, -0.2]);
    immersion.update(state, sloped);
    const wrench = createWrench();
    applyPressure(immersion.surface, state.position, wrench);
    const lift = WEIGHT * volume;
    close(wrench.force, new Vector3(-slope * lift, lift, 0), lift * 1e-9);
  });

  test("a tilted box displaces the analytic trapezoidal prism", () => {
    const [beam, height, length] = SIZE;
    const mesh = createHullMesh("box", SIZE, 0.4);
    const immersion = createImmersion(mesh);
    const roll = 0.2;
    const slope = Math.tan(roll);
    const state = pose(0, [0, 0, 0]);
    state.orientation.setFromAxisAngle(new Vector3(0, 0, 1), roll);
    immersion.update(state, water);
    const wrench = createWrench();
    const displaced = applyPressure(immersion.surface, state.position, wrench);
    assert.ok(Math.abs(displaced - (beam * height * length) / 2) < 1e-9);
    const center = new Vector3();
    submergedCentroid(immersion.surface, center);
    const local = new Vector3(
      (-slope * beam * beam) / (6 * height),
      -height / 4 + (slope * slope * beam * beam) / (12 * height),
      0
    );
    local.applyQuaternion(state.orientation).add(state.position);
    close(center, local, 1e-9);
  });
});
