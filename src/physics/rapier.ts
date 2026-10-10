import type * as RapierModule from "@dimforge/rapier3d-compat";

export type Rapier = typeof RapierModule;

export type {
  Collider,
  ColliderDesc,
  DebugRenderBuffers,
  EventQueue,
  RigidBody,
  RigidBodyDesc,
  World,
} from "@dimforge/rapier3d-compat";

let loading: Promise<Rapier> | null = null;

async function initRapier(): Promise<Rapier> {
  const rapier = await import("@dimforge/rapier3d-compat");
  await rapier.init();
  return rapier;
}

export function loadRapier(): Promise<Rapier> {
  if (loading === null) {
    const pending = initRapier();
    loading = pending;
    pending.catch(() => {
      if (loading === pending) loading = null;
    });
  }
  return loading;
}
