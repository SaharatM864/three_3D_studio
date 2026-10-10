import type { Object3D } from "three";

import { createFixedStepClock } from "@/physics/clock";
import type { BodyMass } from "@/physics/dynamics/mass";
import type { Rapier } from "@/physics/rapier";
import type { ColliderGeometry } from "@/physics/shapes";
import { createPhysicsWorld, type PhysicsWorld } from "@/physics/world";
import type { ResolvedPhysics } from "@/presets/physics";

import type { Disposable } from "../use-disposable";

export interface PhysicsObjectInit {
  readonly id: string;
  readonly physics: ResolvedPhysics;
  readonly geometry: ColliderGeometry;
  readonly target: Object3D;
  readonly mass?: BodyMass;
  readonly canSleep?: boolean;
  readonly maxAngularSpeed?: number;
}

export interface PhysicsHandle extends Disposable {
  readonly world: PhysicsWorld;
  add(init: PhysicsObjectInit): () => void;
  update(delta: number): boolean;
}

interface Binding {
  readonly id: string;
  readonly target: Object3D;
  readonly dynamic: boolean;
}

export function createPhysics(rapier: Rapier): PhysicsHandle {
  const world = createPhysicsWorld(rapier);
  const clock = createFixedStepClock(world.timestep);
  const bindings: Binding[] = [];
  const timing = { delta: 0, residual: 0 };

  return {
    world,

    add({ id, physics, geometry, target, mass, canSleep, maxAngularSpeed }) {
      const remove = world.add({
        id,
        physics,
        geometry,
        position: target.position,
        quaternion: target.quaternion,
        mass,
        canSleep,
        maxAngularSpeed,
      });
      const binding: Binding = {
        id,
        target,
        dynamic: physics.body === "dynamic",
      };
      bindings.push(binding);
      return () => {
        const index = bindings.indexOf(binding);
        if (index >= 0) bindings.splice(index, 1);
        remove();
      };
    },

    update(delta) {
      for (const { id, target, dynamic } of bindings) {
        if (!dynamic) world.setTarget(id, target.position, target.quaternion);
      }
      const steps = clock.advance(delta);
      timing.delta = delta;
      timing.residual = clock.residual;
      world.advance(steps, timing);
      for (const { id, target, dynamic } of bindings) {
        if (dynamic) {
          world.readPose(id, clock.alpha, target.position, target.quaternion);
        }
      }
      return world.isMoving();
    },

    dispose() {
      bindings.length = 0;
      world.dispose();
    },
  };
}
