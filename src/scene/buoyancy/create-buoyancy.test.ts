import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Object3D, Vector3 } from "three";

import type { BuoyancySpec, Vec3 } from "@/model/types";
import { loadRapier } from "@/physics/rapier";
import { resolveBuoyancy } from "@/presets/buoyancy";
import { resolvePhysics } from "@/presets/physics";

import { createPhysics } from "../physics/create-physics";
import { createBuoyancy } from "./create-buoyancy";

const rapier = await loadRapier();

const FRAME = 1 / 60;
const BOW = new Vector3(0, 0, 1);

interface Floater {
  readonly size: Vec3;
  readonly buoyancy: BuoyancySpec;
  readonly position?: Vec3;
  readonly yaw?: number;
}

function simulate(floater: Floater, seconds: number): Object3D {
  const physics = createPhysics(rapier);
  const buoyancy = createBuoyancy(physics);
  try {
    const target = new Object3D();
    target.position.set(...(floater.position ?? [0, 0, 0]));
    target.rotation.set(0, floater.yaw ?? 0, 0);
    const physicsSpec = resolvePhysics(undefined, true);
    assert.ok(physicsSpec !== null);
    buoyancy.add({
      id: "floater",
      buoyancy: resolveBuoyancy(floater.buoyancy, {
        shape: "box",
        size: floater.size,
      }),
      physics: physicsSpec,
      geometry: null,
      target,
    });
    for (let frame = 0; frame < seconds / FRAME; frame++) {
      physics.update(FRAME);
    }
    return target;
  } finally {
    buoyancy.dispose();
    physics.dispose();
  }
}

describe("buoyancy on DynamicBody", () => {
  test("a flat box settles at its Archimedes draft", () => {
    const target = simulate(
      {
        size: [2, 0.5, 2],
        buoyancy: { density: 512.5, grid: [3, 3] },
        position: [0, 0.2, 0],
      },
      15
    );
    assert.ok(
      Math.abs(target.position.y) < 0.01,
      `center at ${target.position.y}`
    );
    const tilt = new Vector3(0, 1, 0).applyQuaternion(target.quaternion);
    assert.ok(tilt.y > 0.9999, `tilted to ${tilt.y}`);
  });

  test("a runabout drives toward its bow", () => {
    const yaw = 0.6;
    const target = simulate(
      {
        size: [2.1, 1.45, 6.5],
        buoyancy: { presetId: "runabout", throttle: 0.5 },
        yaw,
      },
      5
    );
    const heading = BOW.clone().applyAxisAngle(new Vector3(0, 1, 0), yaw);
    const travel = new Vector3(target.position.x, 0, target.position.z);
    assert.ok(travel.length() > 10, `travelled ${travel.length()} m`);
    assert.ok(travel.normalize().dot(heading) > 0.99);
  });

  test("positive steer turns a runabout to starboard (−X)", () => {
    const target = simulate(
      {
        size: [2.1, 1.45, 6.5],
        buoyancy: { presetId: "runabout", throttle: 0.5, steer: 0.4 },
      },
      2
    );
    const heading = BOW.clone().applyQuaternion(target.quaternion);
    assert.ok(heading.x < -0.1, `heading ${heading.toArray()}`);
  });
});
