import { Vector2 } from "three";
import { attributeArray, uniform } from "three/tsl";
import type { ComputeNode, StorageTexture, WebGPURenderer } from "three/webgpu";

import type { Disposable } from "../../use-disposable";
import { createCascade, type Cascade } from "./cascade";
import { createCascadeMaps, type CascadeMaps } from "./cascade-maps";
import {
  OCEAN_BOUNDARY_FACTOR,
  OCEAN_FFT_SIZE,
  OCEAN_LENGTH_SCALES,
  spectrumKey,
  type SimulationParameters,
} from "./config";
import { createFFT } from "./fft";
import { gaussianNoise } from "./gaussian-noise";
import { applySpectrumParameters, createSpectrumUniforms } from "./spectrum";

const FIELD_NAMES = ["DxDz", "DyDxz", "DyxDyz", "DxxDzz"] as const;
const FOAM_DRIFT_FRACTION = 0.03;

export interface OceanCascadeMaps {
  readonly size: number;
  readonly lengthScale: number;
  readonly displacement: StorageTexture;
  readonly derivatives: StorageTexture;
}

export interface OceanSimulation extends Disposable {
  readonly cascades: readonly OceanCascadeMaps[];
  setParameters(parameters: SimulationParameters): Promise<void>;
  reset(): void;
  step(time: number, dt: number): void;
}

export function createOceanSimulation(
  renderer: WebGPURenderer
): OceanSimulation {
  const size = OCEAN_FFT_SIZE;
  const uniforms = createSpectrumUniforms();
  const time = uniform(0);
  const foam = {
    lambda: uniform(1),
    dt: uniform(1 / 60),
    foamDecay: uniform(1),
    foamSpread: uniform(1),
    drift: uniform(new Vector2()),
    reset: uniform(1),
  };

  const noise = attributeArray(size * size, "vec2");
  let noiseSeed: number | null = null;

  const boundary = (index: number) =>
    ((2 * Math.PI) / OCEAN_LENGTH_SCALES[index]) * OCEAN_BOUNDARY_FACTOR;
  const lastIndex = OCEAN_LENGTH_SCALES.length - 1;
  const cascades: Cascade[] = OCEAN_LENGTH_SCALES.map((lengthScale, index) =>
    createCascade({
      size,
      lengthScale,
      cutoffLow: index === 0 ? 1e-4 : boundary(index),
      cutoffHigh: index === lastIndex ? 9999 : boundary(index + 1),
      noise,
      uniforms,
      time,
    })
  );

  const fft = createFFT(size);
  const passes = cascades.flatMap((cascade) =>
    FIELD_NAMES.map((name) =>
      fft.buildField(cascade.fields[name], attributeArray(size * size, "vec2"))
    )
  );
  const spectrumNodes: ComputeNode[] = [
    ...cascades.map((cascade) => cascade.timeDependent),
    ...range(fft.logSize).flatMap((stage) =>
      passes.map((pass) => pass.horizontal[stage])
    ),
    ...range(fft.logSize).flatMap((stage) =>
      passes.map((pass) => pass.vertical[stage])
    ),
    ...passes.map((pass) => pass.permute),
  ];

  const maps: CascadeMaps[] = cascades.map((cascade) =>
    createCascadeMaps(cascade, foam)
  );
  const stepGroups: [ComputeNode[], ComputeNode[]] = [
    [...spectrumNodes, ...maps.map((map) => map.assemble[0])],
    [...spectrumNodes, ...maps.map((map) => map.assemble[1])],
  ];

  let parameters: SimulationParameters | null = null;
  let appliedKey: string | null = null;
  let spectrumTask: Promise<void> = Promise.resolve();
  let frame = 0;
  let disposed = false;

  function applyLiveParameters(next: SimulationParameters): void {
    foam.lambda.value = next.lambda;
    foam.foamDecay.value = next.foamDecay;
    foam.foamSpread.value = next.foamSpread;
    const direction = (next.local.windDirection * Math.PI) / 180;
    const speed = FOAM_DRIFT_FRACTION * next.local.windSpeed;
    foam.drift.value.set(
      speed * Math.cos(direction),
      speed * Math.sin(direction)
    );
  }

  async function rebuildSpectrum(): Promise<void> {
    const target = parameters;
    if (disposed || target === null) return;
    const key = spectrumKey(target);
    if (key === appliedKey) return;
    if (noiseSeed !== target.seed) {
      noise.value.array.set(gaussianNoise(size, target.seed));
      noise.value.needsUpdate = true;
      noiseSeed = target.seed;
    }
    applySpectrumParameters(uniforms, target);
    for (const cascade of cascades) {
      await renderer.computeAsync(cascade.initial);
      await renderer.computeAsync(cascade.conjugate);
    }
    appliedKey = key;
  }

  function setParameters(next: SimulationParameters): Promise<void> {
    parameters = next;
    applyLiveParameters(next);
    spectrumTask = spectrumTask.catch(() => {}).then(rebuildSpectrum);
    return spectrumTask;
  }

  return {
    cascades: cascades.map((cascade, index) => ({
      size,
      lengthScale: cascade.lengthScale,
      displacement: maps[index].displacement,
      derivatives: maps[index].derivatives,
    })),

    setParameters,

    reset() {
      foam.reset.value = 1;
    },

    step(stepTime, dt) {
      if (disposed) return;
      time.value = stepTime;
      foam.dt.value = Math.max(dt, 0);
      renderer.compute(stepGroups[frame & 1]);
      frame += 1;
      foam.reset.value = 0;
    },

    dispose() {
      disposed = true;
      for (const cascade of cascades) {
        cascade.initial.dispose();
        cascade.conjugate.dispose();
      }
      for (const node of spectrumNodes) node.dispose();
      for (const map of maps) map.dispose();
    },
  };
}

function range(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index);
}
