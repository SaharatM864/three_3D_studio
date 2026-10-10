import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Quaternion, Vector3 } from "three";

import type { PhysicsSpec } from "@/model/types";
import { resolvePhysics, type ResolvedPhysics } from "@/presets/physics";

import type { BodyMass } from "./dynamics/mass";
import { loadRapier } from "./rapier";
import type { ColliderGeometry } from "./shapes";
import {
  createPhysicsWorld,
  type FrameTiming,
  type PhysicsBodyInit,
  type PhysicsWorld,
} from "./world";

const rapier = await loadRapier();

const TIMING: FrameTiming = { delta: 0, residual: 0 };
const CUBE: ColliderGeometry = {
  kind: "cuboid",
  halfExtents: [0.5, 0.5, 0.5],
  offset: [0, 0, 0],
};
const MASS: BodyMass = {
  mass: 2,
  centerOfMass: new Vector3(),
  inertia: new Vector3(1, 1, 1),
};

function physics(spec: PhysicsSpec): ResolvedPhysics {
  const resolved = resolvePhysics(spec, false);
  assert.ok(resolved !== null);
  return resolved;
}

const FLOATING = physics({ body: "dynamic", gravityScale: 0 });

function withWorld(run: (world: PhysicsWorld) => void): void {
  const world = createPhysicsWorld(rapier);
  try {
    run(world);
  } finally {
    world.dispose();
  }
}

function addBody(
  world: PhysicsWorld,
  id: string,
  init: Partial<PhysicsBodyInit> = {}
): () => void {
  return world.add({
    id,
    physics: FLOATING,
    geometry: CUBE,
    position: new Vector3(),
    quaternion: new Quaternion(),
    mass: MASS,
    ...init,
  });
}

function velocityOf(world: PhysicsWorld, id: string): Vector3 {
  const body = world.body(id);
  assert.ok(body !== null);
  const velocity = new Vector3();
  body.linvel(velocity);
  return velocity;
}

describe("PhysicsWorld forces", () => {
  test("a force lasts one step", () => {
    withWorld((world) => {
      addBody(world, "a");
      let pushes = 1;
      world.addSystem({
        beforeStep(step) {
          if (pushes-- > 0) {
            step.world.dynamicBody("a")?.addForce(new Vector3(2, 0, 0));
          }
        },
      });
      world.advance(1, TIMING);
      const expected = world.timestep;
      assert.ok(Math.abs(velocityOf(world, "a").x - expected) < 1e-6);
      world.advance(10, TIMING);
      assert.ok(Math.abs(velocityOf(world, "a").x - expected) < 1e-6);
    });
  });

  test("forces from several systems add up", () => {
    withWorld((world) => {
      addBody(world, "a");
      for (let index = 0; index < 2; index++) {
        world.addSystem({
          beforeStep(step) {
            step.world.dynamicBody("a")?.addForce(new Vector3(1, 0, 0));
          },
        });
      }
      world.advance(1, TIMING);
      assert.ok(Math.abs(velocityOf(world, "a").x - world.timestep) < 1e-6);
    });
  });

  test("dynamicBody is null for fixed bodies", () => {
    withWorld((world) => {
      addBody(world, "ground", { physics: physics({}), mass: undefined });
      addBody(world, "a");
      world.advance(1, TIMING);
      assert.equal(world.dynamicBody("ground"), null);
      assert.notEqual(world.dynamicBody("a"), null);
    });
  });

  test("maxAngularSpeed caps the spin", () => {
    withWorld((world) => {
      addBody(world, "a", { maxAngularSpeed: 1 });
      world.addSystem({
        beforeStep(step) {
          step.world.dynamicBody("a")?.addTorque(new Vector3(0, 100, 0));
        },
      });
      world.advance(50, TIMING);
      const body = world.body("a");
      assert.ok(body !== null);
      const spin = new Vector3();
      body.angvel(spin);
      const speed = spin.length();
      assert.ok(speed <= 1 + 1e-6 && speed > 0.99, `spin ${speed}`);
    });
  });
});

describe("PhysicsWorld integration", () => {
  test("creation order does not change the result", () => {
    const ids = ["a", "b", "c"];
    const starts = [
      new Vector3(0, 1, 0),
      new Vector3(0.2, 2.2, 0.1),
      new Vector3(-0.1, 3.4, 0.2),
    ];
    const run = (order: readonly string[]) => {
      const poses: number[][] = [];
      withWorld((world) => {
        for (const id of order) {
          if (id === "ground") {
            addBody(world, id, {
              physics: physics({}),
              geometry: {
                kind: "cuboid",
                halfExtents: [5, 0.5, 5],
                offset: [0, 0, 0],
              },
              position: new Vector3(0, -0.5, 0),
              mass: undefined,
            });
            continue;
          }
          const index = ids.indexOf(id);
          addBody(world, id, {
            physics: physics({ body: "dynamic" }),
            position: starts[index],
            quaternion: new Quaternion().setFromAxisAngle(
              new Vector3(1, 1, 0).normalize(),
              0.3 * index
            ),
          });
        }
        world.advance(240, TIMING);
        const position = new Vector3();
        const quaternion = new Quaternion();
        for (const id of ids) {
          world.readPose(id, 1, position, quaternion);
          poses.push([...position.toArray(), ...quaternion.toArray()]);
        }
      });
      return poses;
    };
    assert.deepEqual(
      run(["a", "b", "c", "ground"]),
      run(["ground", "c", "a", "b"])
    );
  });

  test("Rapier integrates the gyroscopic term", () => {
    withWorld((world) => {
      const inertia = new Vector3(1, 2, 3);
      addBody(world, "a", {
        mass: { mass: 1, centerOfMass: new Vector3(), inertia },
      });
      world.advance(1, TIMING);
      const body = world.body("a");
      assert.ok(body !== null);
      body.setAngvel({ x: 0.01, y: 5, z: 0.01 }, true);

      const orientation = new Quaternion();
      const inverse = new Quaternion();
      const spin = new Vector3();
      const momentum = () => {
        body.rotation(orientation);
        inverse.copy(orientation).invert();
        body.angvel(spin);
        const local = spin.clone().applyQuaternion(inverse);
        return {
          local,
          world: local.clone().multiply(inertia).applyQuaternion(orientation),
        };
      };

      const start = momentum().world;
      let drift = 0;
      let lowest = Infinity;
      for (let index = 0; index < 1200; index++) {
        world.advance(1, TIMING);
        const { local, world: current } = momentum();
        drift = Math.max(drift, current.distanceTo(start) / start.length());
        lowest = Math.min(lowest, local.y);
      }
      assert.ok(drift < 0.02, `angular momentum drifted ${drift}`);
      assert.ok(lowest < 0, `intermediate axis never flipped (${lowest})`);
    });
  });
});
