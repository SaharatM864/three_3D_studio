import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Euler, Object3D, Vector3 } from "three";

import type { BuoyancySpec, HullShape, Vec3 } from "@/model/types";
import { WATER_DENSITY } from "@/physics/buoyancy/constants";
import { createFloatingBody } from "@/physics/buoyancy/floating-body";
import { createImmersion } from "@/physics/buoyancy/forces/immersion";
import {
  applyPressure,
  submergedCentroid,
} from "@/physics/buoyancy/forces/pressure";
import { createWrench } from "@/physics/buoyancy/forces/wrench";
import { createHullMesh } from "@/physics/buoyancy/hull/mesh";
import { createFlatWater } from "@/physics/buoyancy/water";
import { createRigidBodyState } from "@/physics/dynamics/body-state";
import { loadRapier } from "@/physics/rapier";
import { resolveBuoyancy } from "@/presets/buoyancy";
import { resolvePhysics } from "@/presets/physics";

import { createPhysics } from "../physics/create-physics";
import { createBuoyancy } from "./create-buoyancy";

const rapier = await loadRapier();

const FRAME = 1 / 60;
const BOW = new Vector3(0, 0, 1);
const PORT = new Vector3(1, 0, 0);
const UP = new Vector3(0, 1, 0);
const RUNABOUT: Vec3 = [2.1, 1.45, 6.5];
const DEGREE = Math.PI / 180;

interface Floater {
  readonly size: Vec3;
  readonly buoyancy: BuoyancySpec;
  readonly shape?: HullShape;
  readonly position?: Vec3;
  readonly rotation?: Vec3;
}

interface Sample {
  readonly time: number;
  readonly target: Object3D;
  readonly velocity: Vector3;
}

const RUNABOUT_AT_REST: Floater = {
  size: RUNABOUT,
  shape: "boat",
  buoyancy: { presetId: "runabout" },
};

function resolve(floater: Floater) {
  return resolveBuoyancy(floater.buoyancy, {
    shape: floater.shape ?? "box",
    size: floater.size,
  });
}

function simulate(
  floater: Floater,
  seconds: number,
  observe?: (sample: Sample) => void
): Sample {
  const physics = createPhysics(rapier);
  const buoyancy = createBuoyancy(physics);
  try {
    const target = new Object3D();
    target.position.set(...(floater.position ?? [0, 0, 0]));
    target.rotation.set(...(floater.rotation ?? [0, 0, 0]));
    const physicsSpec = resolvePhysics(undefined, true);
    assert.ok(physicsSpec !== null);
    buoyancy.add({
      id: "floater",
      buoyancy: resolve(floater),
      physics: physicsSpec,
      geometry: null,
      target,
    });
    const velocity = new Vector3();
    let time = 0;
    for (let frame = 0; frame < seconds / FRAME; frame++) {
      physics.update(FRAME);
      time += FRAME;
      const body = physics.world.body("floater");
      if (body !== null) velocity.copy(body.linvel());
      observe?.({ time, target, velocity });
    }
    return { time, target, velocity };
  } finally {
    buoyancy.dispose();
    physics.dispose();
  }
}

function restHeight(floater: Floater): number {
  const floating = createFloatingBody(resolve(floater));
  return floating.hydrostatics.height - floating.mass.centerOfMass.y;
}

function attitude(target: Object3D) {
  const degrees = (value: number) => value / DEGREE;
  return {
    trim: degrees(Math.asin(BOW.clone().applyQuaternion(target.quaternion).y)),
    heel: degrees(Math.asin(PORT.clone().applyQuaternion(target.quaternion).y)),
    tilt: degrees(Math.acos(UP.clone().applyQuaternion(target.quaternion).y)),
  };
}

function period(series: readonly (readonly [number, number])[]): number {
  const crossings: number[] = [];
  for (let index = 1; index < series.length; index++) {
    if (series[index - 1][1] < 0 && series[index][1] >= 0) {
      crossings.push(series[index][0]);
    }
  }
  assert.ok(crossings.length >= 3, `only ${crossings.length} oscillations`);
  return (
    (crossings[crossings.length - 1] - crossings[0]) / (crossings.length - 1)
  );
}

function immersed(floater: Floater, target: Object3D) {
  const resolved = resolve(floater);
  const floating = createFloatingBody(resolved);
  const immersion = createImmersion(
    createHullMesh(resolved.shape, resolved.size, resolved.waveFilter)
  );
  const state = createRigidBodyState();
  state.localCenterOfMass.copy(floating.mass.centerOfMass);
  state.orientation.copy(target.quaternion);
  state.position
    .copy(floating.mass.centerOfMass)
    .applyQuaternion(target.quaternion)
    .add(target.position);
  immersion.update(state, createFlatWater(0));
  const volume = applyPressure(
    immersion.surface,
    state.position,
    createWrench()
  );
  const center = new Vector3();
  submergedCentroid(immersion.surface, center);
  return { volume, center, centerOfMass: state.position, floating };
}

describe("buoyancy on DynamicBody", () => {
  test("a flat box settles at its Archimedes draft", () => {
    const { target } = simulate(
      {
        size: [2, 0.5, 2],
        buoyancy: { density: 512.5 },
        position: [0, 0.2, 0],
      },
      15
    );
    assert.ok(
      Math.abs(target.position.y) < 0.01,
      `center at ${target.position.y}`
    );
    assert.ok(attitude(target).tilt < 0.01);
  });

  test("a 500 kg cube displaces 500/ρ and leaves its unstable upright pose", () => {
    const floater: Floater = {
      size: [1, 1, 1],
      buoyancy: { mass: 500 },
      position: [0, 0.0122, 0],
      rotation: [0.02, 0, 0.03],
    };
    const { target } = simulate(floater, 60);
    const { volume } = immersed(floater, target);
    assert.ok(
      Math.abs(volume / (500 / WATER_DENSITY) - 1) < 0.005,
      `displaced ${volume} m³`
    );
    assert.ok(attitude(target).tilt > 20, `tilt ${attitude(target).tilt}°`);
  });

  test("a runabout at rest neither drifts nor lists", () => {
    const { target } = simulate(
      { ...RUNABOUT_AT_REST, position: [0, restHeight(RUNABOUT_AT_REST), 0] },
      20
    );
    const drift = Math.hypot(target.position.x, target.position.z);
    assert.ok(drift < 0.005, `drifted ${drift} m`);
    assert.ok(Math.abs(attitude(target).heel) < 0.05);
    const { volume, center, centerOfMass, floating } = immersed(
      RUNABOUT_AT_REST,
      target
    );
    assert.ok(
      Math.abs(volume / floating.hydrostatics.displacement - 1) < 0.001,
      `displaced ${volume} m³`
    );
    assert.ok(
      Math.hypot(center.x - centerOfMass.x, center.z - centerOfMass.z) < 0.01,
      "the centre of buoyancy is not under the centre of mass"
    );
  });

  test("roll and heave periods follow the hydrostatic stiffness", () => {
    const { mass, hydrostatics } = createFloatingBody(
      resolve(RUNABOUT_AT_REST)
    );
    const rest = restHeight(RUNABOUT_AT_REST);

    const roll: [number, number][] = [];
    simulate(
      {
        ...RUNABOUT_AT_REST,
        position: [0, rest, 0],
        rotation: [0, 0, 5 * DEGREE],
      },
      8,
      ({ time, target }) => roll.push([time, attitude(target).heel])
    );
    const rollPeriod =
      2 * Math.PI * Math.sqrt(mass.inertia.z / hydrostatics.roll);
    assert.ok(
      Math.abs(period(roll) / rollPeriod - 1) < 0.1,
      `roll period ${period(roll)} s, expected ${rollPeriod} s`
    );

    const heave: [number, number][] = [];
    simulate(
      { ...RUNABOUT_AT_REST, position: [0, rest - 0.1, 0] },
      6,
      ({ time, target }) => heave.push([time, target.position.y - rest])
    );
    const heavePeriod = 2 * Math.PI * Math.sqrt(mass.mass / hydrostatics.heave);
    assert.ok(
      Math.abs(period(heave) / heavePeriod - 1) < 0.15,
      `heave period ${period(heave)} s, expected ${heavePeriod} s`
    );
  });

  test("a runabout rights itself from 60° of heel", () => {
    const { target } = simulate(
      {
        ...RUNABOUT_AT_REST,
        position: [0, restHeight(RUNABOUT_AT_REST), 0],
        rotation: [0, 0, 60 * DEGREE],
      },
      15
    );
    assert.ok(Math.abs(attitude(target).heel) < 0.5);
  });

  test("a top-heavy box lists to its angle of loll", () => {
    const { target } = simulate(
      {
        size: [1, 2, 4],
        buoyancy: { density: 512.5, centerOfMass: [0, 0.2, 0] },
        rotation: [0, 0, 0.02],
      },
      20
    );
    assert.ok(Math.abs(attitude(target).heel) > 10);
  });

  test("a crate heavier than water sinks", () => {
    const { target } = simulate(
      { size: [1, 1, 1], buoyancy: { presetId: "crate", density: 1100 } },
      10
    );
    assert.ok(target.position.y < -5, `crate at ${target.position.y} m`);
  });

  test("a runabout dropped from 2 m lands without bouncing", () => {
    const rest = restHeight(RUNABOUT_AT_REST);
    let landed = false;
    let rebound = -Infinity;
    const { target, velocity } = simulate(
      { ...RUNABOUT_AT_REST, position: [0, rest + 2, 0] },
      8,
      ({ target, velocity }) => {
        if (landed) rebound = Math.max(rebound, target.position.y - rest);
        else landed = target.position.y < rest && velocity.y > 0;
      }
    );
    assert.ok(landed && rebound < 0.3, `bounced ${rebound} m`);
    assert.ok(Math.abs(target.position.y - rest) < 0.02);
    assert.ok(velocity.length() < 0.05);
  });

  test("a runabout released 2 m under water floats back to its draft", () => {
    const rest = restHeight(RUNABOUT_AT_REST);
    const { target } = simulate(
      { ...RUNABOUT_AT_REST, position: [0, rest - 2, 0] },
      15
    );
    assert.ok(Math.abs(target.position.y - rest) < 0.01);
  });

  test("a runabout at full throttle planes near its top speed", () => {
    const floater: Floater = {
      ...RUNABOUT_AT_REST,
      buoyancy: { presetId: "runabout", throttle: 1 },
    };
    const { propulsion } = resolve(floater);
    assert.ok(propulsion !== null);
    const { target, velocity } = simulate(floater, 25);
    const speed = velocity.length() / propulsion.maxSpeed;
    assert.ok(speed > 0.85 && speed < 1.15, `speed ${velocity.length()} m/s`);
    const { trim } = attitude(target);
    assert.ok(trim > 0.5 && trim < 6, `trim ${trim}°`);
    assert.ok(target.position.y - restHeight(floater) > 0.05);
  });

  test("a runabout drives toward its bow", () => {
    const yaw = 0.6;
    const { target } = simulate(
      {
        ...RUNABOUT_AT_REST,
        buoyancy: { presetId: "runabout", throttle: 0.5 },
        rotation: [0, yaw, 0],
      },
      5
    );
    const heading = BOW.clone().applyEuler(new Euler(0, yaw, 0));
    const travel = new Vector3(target.position.x, 0, target.position.z);
    assert.ok(travel.length() > 10, `travelled ${travel.length()} m`);
    assert.ok(travel.normalize().dot(heading) > 0.99);
  });

  test("positive steer turns a runabout to starboard (−X)", () => {
    const { target } = simulate(
      {
        ...RUNABOUT_AT_REST,
        buoyancy: { presetId: "runabout", throttle: 0.5, steer: 0.4 },
      },
      2
    );
    const heading = BOW.clone().applyQuaternion(target.quaternion);
    assert.ok(heading.x < -0.1, `heading ${heading.toArray()}`);
  });
});
