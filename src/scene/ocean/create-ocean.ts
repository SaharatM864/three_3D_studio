import { BufferGeometry, Matrix4, Mesh, type Camera } from "three";
import type { WebGPURenderer } from "three/webgpu";

import type { ResolvedOcean } from "@/presets/ocean";
import {
  forEachOceanStep,
  hasOceanMotion,
  oceanSimulationDelta,
  oceanSimulationTime,
  planOceanSteps,
} from "@/timeline/ocean";
import type { OceanStepPolicy } from "@/timeline/types";

import type { OceanGridSettings, OceanRenderSettings } from "../render-config";
import type { Disposable } from "../use-disposable";
import { spectrumKey, toSimulationParameters } from "./simulation/config";
import { createOceanSimulation } from "./simulation/ocean-simulation";
import { createDetailTexture } from "./surface/detail-texture";
import { createSurfaceMaterial } from "./surface/material";
import { createRadialGrid, type RadialGrid } from "./surface/radial-grid";
import {
  applySurfaceExposure,
  applySurfaceOcean,
  createSurfaceUniforms,
} from "./surface/uniforms";

export const OCEAN_STEP_POLICY: OceanStepPolicy = {
  stepSeconds: 1 / 60,
  prerollSteps: 300,
  prerollStride: 10,
  maxCatchUpSteps: 8,
};

export interface OceanHandle extends Disposable {
  readonly ready: Promise<void>;
  readonly mesh: Mesh;
  setOcean(ocean: ResolvedOcean): void;
  setQuality(settings: OceanRenderSettings): void;
  setExposure(exposure: number): void;
  update(camera: Camera, timeSeconds: number): boolean;
}

export function createOcean(
  renderer: WebGPURenderer,
  policy: OceanStepPolicy = OCEAN_STEP_POLICY
): OceanHandle {
  const simulation = createOceanSimulation(renderer);
  const detail = createDetailTexture();
  const uniforms = createSurfaceUniforms();
  const material = createSurfaceMaterial({
    cascades: simulation.cascades,
    detail,
    uniforms,
  });
  const mesh = new Mesh(new BufferGeometry(), material);
  mesh.name = "Ocean";
  mesh.frustumCulled = false;
  mesh.visible = false;

  const lastView = new Matrix4();
  let grid: RadialGrid | null = null;
  let gridSettings: OceanGridSettings | null = null;
  let ocean: ResolvedOcean | null = null;
  let spectrum: string | null = null;
  let spectrumReady = false;
  let lastStep: number | null = null;
  let hasView = false;
  let disposed = false;

  let resolveReady: () => void = () => {};
  let rejectReady: (error: unknown) => void = () => {};
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  ready.catch(() => {});

  function stepSimulation(step: number, span: number): void {
    if (ocean === null) return;
    simulation.step(
      oceanSimulationTime(step, policy, ocean),
      oceanSimulationDelta(span, policy, ocean)
    );
  }

  function updateView(camera: Camera): void {
    camera.updateMatrixWorld();
    if (!hasView) {
      lastView.copy(camera.matrixWorldInverse);
      hasView = true;
    }
    uniforms.previousView.value.copy(lastView);
    lastView.copy(camera.matrixWorldInverse);

    const spacing = grid?.innerSpacing ?? 1;
    const x = Math.round(camera.matrixWorld.elements[12] / spacing) * spacing;
    const z = Math.round(camera.matrixWorld.elements[14] / spacing) * spacing;
    mesh.position.set(x, 0, z);
    uniforms.originXZ.value.set(x, z);
  }

  return {
    ready,
    mesh,

    setOcean(next) {
      ocean = next;
      applySurfaceOcean(uniforms, next);
      const parameters = toSimulationParameters(next);
      const key = spectrumKey(parameters);
      const rebuilt = simulation.setParameters(parameters);
      if (key === spectrum) return;
      spectrum = key;
      rebuilt.then(
        () => {
          if (disposed || spectrum !== key) return;
          lastStep = null;
          if (!spectrumReady) {
            spectrumReady = true;
            resolveReady();
          }
        },
        (error: unknown) => {
          if (!spectrumReady) rejectReady(error);
        }
      );
    },

    setQuality({ grid: settings }) {
      if (gridSettings !== null && sameGrid(gridSettings, settings)) return;
      const previous = grid;
      grid = createRadialGrid(settings);
      gridSettings = settings;
      mesh.geometry = grid.geometry;
      previous?.geometry.dispose();
    },

    setExposure(exposure) {
      applySurfaceExposure(uniforms, exposure);
    },

    update(camera, timeSeconds) {
      if (disposed || !spectrumReady || ocean === null || grid === null) {
        return false;
      }
      updateView(camera);
      const time = hasOceanMotion(ocean) ? timeSeconds : 0;
      const plan = planOceanSteps(lastStep, time, policy);
      if (plan === null) return false;

      if (plan.reset) simulation.reset();
      forEachOceanStep(plan, policy, stepSimulation);
      lastStep = plan.lastStep;
      uniforms.time.value = oceanSimulationTime(plan.lastStep, policy, ocean);
      mesh.visible = true;
      return true;
    },

    dispose() {
      disposed = true;
      mesh.removeFromParent();
      simulation.dispose();
      material.dispose();
      detail.dispose();
      mesh.geometry.dispose();
    },
  };
}

function sameGrid(a: OceanGridSettings, b: OceanGridSettings): boolean {
  return (
    a.rings === b.rings &&
    a.sectors === b.sectors &&
    a.spacing === b.spacing &&
    a.soften === b.soften
  );
}
