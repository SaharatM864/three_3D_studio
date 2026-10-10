import { BufferGeometry, Matrix4, Mesh, type Camera } from "three";
import type { WebGPURenderer } from "three/webgpu";

import type { ResolvedOcean } from "@/presets/ocean";
import { createOceanStepper, type OceanStepVisitor } from "@/timeline/ocean";
import type { OceanClock, OceanMotion } from "@/timeline/types";

import type { WaterLightSource } from "../atmosphere/shadowed-light-node";
import type { OceanGridSettings, OceanRenderSettings } from "../render-config";
import type { Disposable } from "../use-disposable";
import {
  foamPrerollSeconds,
  toSimulationParameters,
} from "./simulation/config";
import { createOceanSimulation } from "./simulation/ocean-simulation";
import {
  applyClipmapLayout,
  createClipmapGeometry,
  resolveClipmapLayout,
  snapClipmap,
  type ClipmapLayout,
} from "./surface/clipmap";
import { createDetailTexture } from "./surface/detail-texture";
import { createSurfaceMaterial } from "./surface/material";
import {
  applySurfaceExposure,
  applySurfaceOcean,
  createSurfaceUniforms,
} from "./surface/uniforms";
import { createCausticsLight } from "./underwater/caustics";
import { UNDERWATER_GATE_HEIGHT } from "./underwater/constants";
import {
  createUnderwaterMedium,
  type UnderwaterMedium,
} from "./underwater/medium";
import { createWaterProbe } from "./underwater/probe";

export type {
  UnderwaterMedium,
  UnderwaterMediumInput,
} from "./underwater/medium";

const OCEAN_RENDER_ORDER = 1;

export interface OceanHandle extends Disposable {
  readonly mesh: Mesh;
  readonly underwater: UnderwaterMedium;
  readonly waterLight: WaterLightSource;
  setOcean(ocean: ResolvedOcean): void;
  setQuality(settings: OceanRenderSettings): void;
  setExposure(exposure: number): void;
  update(camera: Camera, timeSeconds: number): boolean;
}

export function createOcean(
  renderer: WebGPURenderer,
  clock: OceanClock
): OceanHandle {
  const simulation = createOceanSimulation(renderer);
  const stepper = createOceanStepper(clock);
  const detail = createDetailTexture();
  const uniforms = createSurfaceUniforms();
  const probe = createWaterProbe(
    simulation.cascades,
    detail,
    uniforms.cameraPosition,
    uniforms.clipmap.baseSpacing
  );
  const material = createSurfaceMaterial({
    cascades: simulation.cascades,
    detail,
    uniforms,
    waterHeight: probe.height,
  });
  const mesh = new Mesh(new BufferGeometry(), material);
  mesh.name = "Ocean";
  mesh.frustumCulled = false;
  mesh.renderOrder = OCEAN_RENDER_ORDER;
  mesh.visible = false;

  const lastView = new Matrix4();
  const lastProjection = new Matrix4();
  const motion: OceanMotion = { timeScale: 0, prerollSeconds: 0 };
  let layout: ClipmapLayout | null = null;
  let simulationKey: string | null = null;
  let hasView = false;
  let disposed = false;

  const visitStep: OceanStepVisitor = (time, dt, reset) => {
    if (reset) simulation.reset();
    simulation.step(time, dt);
    uniforms.time.value = time;
  };

  function updateView(camera: Camera, grid: ClipmapLayout): void {
    camera.updateMatrixWorld();
    if (!hasView) {
      lastView.copy(camera.matrixWorldInverse);
      lastProjection.copy(camera.projectionMatrix);
      hasView = true;
    }
    uniforms.previousView.value.copy(lastView);
    uniforms.previousProjection.value.copy(lastProjection);
    uniforms.projection.value.copy(camera.projectionMatrix);
    lastView.copy(camera.matrixWorldInverse);
    lastProjection.copy(camera.projectionMatrix);

    snapClipmap(
      grid,
      camera.matrixWorld.elements[12],
      camera.matrixWorld.elements[14],
      uniforms.clipmap
    );
    const origin = uniforms.clipmap.origin.value;
    mesh.position.set(origin.x, 0, origin.y);
  }

  function updateProbe(camera: Camera): void {
    const position = uniforms.cameraPosition.value.setFromMatrixPosition(
      camera.matrixWorld
    );
    const active = mesh.visible && position.y < UNDERWATER_GATE_HEIGHT;
    uniforms.underwaterActive.value = active ? 1 : 0;
    if (active) renderer.compute(probe.compute);
  }

  return {
    mesh,
    underwater: createUnderwaterMedium(uniforms, probe),
    waterLight: createCausticsLight(simulation.cascades, detail, uniforms),

    setOcean(ocean) {
      applySurfaceOcean(uniforms, ocean);
      const parameters = toSimulationParameters(ocean);
      simulation.setParameters(parameters);
      motion.timeScale = ocean.timeScale;
      motion.prerollSeconds = foamPrerollSeconds(ocean.foam.decay);
      const key = JSON.stringify([parameters, ocean.timeScale]);
      if (key !== simulationKey) {
        simulationKey = key;
        stepper.reset();
      }
    },

    setQuality({ grid }) {
      if (layout !== null && sameGrid(layout, grid)) return;
      const next = resolveClipmapLayout(grid);
      const previous = mesh.geometry;
      mesh.geometry = createClipmapGeometry(next);
      applyClipmapLayout(uniforms.clipmap, next);
      layout = next;
      previous.dispose();
    },

    setExposure(exposure) {
      applySurfaceExposure(uniforms, exposure);
    },

    update(camera, timeSeconds) {
      if (disposed || simulationKey === null || layout === null) return false;
      updateView(camera, layout);
      const stepped = stepper.advance(timeSeconds, motion, visitStep);
      if (stepped) mesh.visible = true;
      updateProbe(camera);
      return stepped;
    },

    dispose() {
      disposed = true;
      mesh.removeFromParent();
      simulation.dispose();
      probe.dispose();
      material.dispose();
      detail.dispose();
      mesh.geometry.dispose();
    },
  };
}

function sameGrid(a: OceanGridSettings, b: OceanGridSettings): boolean {
  return (
    a.baseSpacing === b.baseSpacing &&
    a.resolution === b.resolution &&
    a.levels === b.levels
  );
}
