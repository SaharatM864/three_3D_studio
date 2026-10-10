import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Quaternion, Vector3, type Vector3Like } from "three";

import { loadRapier, type RigidBody } from "../rapier";
import { pointVelocity } from "./body-state";
import { createDynamicBody, type ManagedDynamicBody } from "./dynamic-body";

const rapier = await loadRapier();

const TOLERANCE = 1e-4;
const POSITION = new Vector3(1, 2, 3);
const ROTATION = new Quaternion().setFromAxisAngle(
  new Vector3(0, 1, 0),
  Math.PI / 2
);
const CENTER_OF_MASS = new Vector3(0, -0.5, 1);

function assertVector(actual: Vector3Like, expected: Vector3Like): void {
  const error = Math.hypot(
    actual.x - expected.x,
    actual.y - expected.y,
    actual.z - expected.z
  );
  assert.ok(
    error < TOLERANCE,
    `expected (${expected.x}, ${expected.y}, ${expected.z}), got (${actual.x}, ${actual.y}, ${actual.z})`
  );
}

interface Subject {
  readonly raw: RigidBody;
  readonly body: ManagedDynamicBody;
}

function withBody(run: (subject: Subject) => void): void {
  const world = new rapier.World({ x: 0, y: 0, z: 0 });
  try {
    const raw = world.createRigidBody(
      rapier.RigidBodyDesc.dynamic()
        .setTranslation(POSITION.x, POSITION.y, POSITION.z)
        .setRotation(ROTATION)
    );
    world.createCollider(rapier.ColliderDesc.ball(0.5).setDensity(0), raw);
    raw.setAdditionalMassProperties(
      10,
      CENTER_OF_MASS,
      { x: 1, y: 2, z: 3 },
      { x: 0, y: 0, z: 0, w: 1 },
      true
    );
    world.step();
    run({ raw, body: createDynamicBody("body", raw) });
  } finally {
    world.free();
  }
}

describe("DynamicBody", () => {
  test("addForceAtPoint adds the moment about the center of mass", () => {
    withBody(({ raw, body }) => {
      const force = new Vector3(0, 10, 0);
      const point = new Vector3(2, 1, 5);
      body.beginStep();
      body.addForceAtPoint(force, point);
      body.commit();
      const center = CENTER_OF_MASS.clone()
        .applyQuaternion(ROTATION)
        .add(POSITION);
      assertVector(body.state.position, center);
      assertVector(raw.userForce(), force);
      assertVector(
        raw.userTorque(),
        new Vector3().subVectors(point, center).cross(force)
      );
    });
  });

  test("local force and torque turn with the body", () => {
    withBody(({ raw, body }) => {
      body.beginStep();
      body.addLocalForce(new Vector3(0, 0, 100));
      body.addLocalTorque(new Vector3(10, 0, 0));
      body.commit();
      assertVector(raw.userForce(), new Vector3(100, 0, 0));
      assertVector(raw.userTorque(), new Vector3(0, 0, -10));
    });
  });

  test("addLocalForceAtPoint measures the arm from the local center of mass", () => {
    withBody(({ raw, body }) => {
      body.beginStep();
      body.addLocalForceAtPoint(new Vector3(1, 0, 0), new Vector3(0, -0.5, 2));
      body.commit();
      assertVector(raw.userForce(), new Vector3(0, 0, -1));
      assertVector(raw.userTorque(), new Vector3(0, 1, 0));
    });
  });

  test("world and local contributions sum into one wrench", () => {
    withBody(({ raw, body }) => {
      body.beginStep();
      body.addForce(new Vector3(1, 2, 3));
      body.addLocalForce(new Vector3(0, 0, 1));
      body.addTorque(new Vector3(0, 1, 0));
      body.addLocalTorque(new Vector3(0, 1, 0));
      body.commit();
      assertVector(raw.userForce(), new Vector3(2, 2, 3));
      assertVector(raw.userTorque(), new Vector3(0, 2, 0));
    });
  });

  test("a wrench lasts one step", () => {
    withBody(({ raw, body }) => {
      body.beginStep();
      body.addForce(new Vector3(5, 0, 0));
      body.addTorque(new Vector3(0, 0, 5));
      body.commit();
      assertVector(raw.userForce(), new Vector3(5, 0, 0));
      body.beginStep();
      body.commit();
      assertVector(raw.userForce(), new Vector3());
      assertVector(raw.userTorque(), new Vector3());
    });
  });

  test("state reports body-frame velocities", () => {
    withBody(({ raw, body }) => {
      raw.setLinvel({ x: 1, y: 0, z: 0 }, true);
      raw.setAngvel({ x: 0, y: 2, z: 0 }, true);
      body.beginStep();
      const { state } = body;
      assertVector(state.localVelocity, new Vector3(0, 0, 1));
      assertVector(state.localAngularVelocity, new Vector3(0, 2, 0));
      assertVector(state.localCenterOfMass, CENTER_OF_MASS);
      assertVector(
        pointVelocity(state, new Vector3(0, 0, 1), new Vector3()),
        new Vector3(3, 0, 0)
      );
    });
  });
});
