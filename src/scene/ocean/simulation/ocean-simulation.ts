import { Vector2 } from "three";
import { attributeArray, uniform } from "three/tsl";
import type { ComputeNode, StorageTexture, WebGPURenderer } from "three/webgpu";

import type { Disposable } from "../../use-disposable";
import { createCascade, type Cascade } from "./cascade";
import {
  createCascadeMaps,
  type AssembleUniforms,
  type CascadeMaps,
} from "./cascade-maps";
import {
  OCEAN_FFT_SIZE,
  OCEAN_LENGTH_SCALES,
  oceanBandCutoffs,
  spectrumKey,
  type SimulationParameters,
} from "./config";
import { createFFT } from "./fft";
import { gaussianNoise } from "./gaussian-noise";
import {
  applyInitialSpectrumParameters,
  applyLiveSpectrumParameters,
  createSpectrumUniforms,
} from "./spectrum";

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
  setParameters(parameters: SimulationParameters): void;
  reset(): void;
  step(time: number, dt: number): void;
}

export function createOceanSimulation(
  renderer: WebGPURenderer
): OceanSimulation {
  const size = OCEAN_FFT_SIZE;
  const spectrum = createSpectrumUniforms();
  const time = uniform(0);
  const assemble: AssembleUniforms = {
    lambda: uniform(0),
    dt: uniform(0),
    foamDecay: uniform(0),
    foamSpread: uniform(0),
    drift: uniform(new Vector2()),
    reset: uniform(1),
  };

  const noise = attributeArray(size * size, "vec2");
  let noiseSeed: number | null = null;

  const cascades: Cascade[] = OCEAN_LENGTH_SCALES.map((lengthScale, index) => {
    const [cutoffLow, cutoffHigh] = oceanBandCutoffs(index);
    return createCascade({
      size,
      lengthScale,
      cutoffLow,
      cutoffHigh,
      noise,
      uniforms: spectrum,
      time,
    });
  });
  const spectrumNodes = cascades.flatMap((cascade) => [
    cascade.initial,
    cascade.conjugate,
  ]);

  const fft = createFFT(size);
  const passes = cascades.flatMap((cascade) =>
    FIELD_NAMES.map((name) =>
      fft.buildField(cascade.fields[name], attributeArray(size * size, "vec2"))
    )
  );
  const stepNodes: ComputeNode[] = [
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
    createCascadeMaps(cascade, assemble)
  );
  const stepGroups: [ComputeNode[], ComputeNode[]] = [
    [...stepNodes, ...maps.map((map) => map.assemble[0])],
    [...stepNodes, ...maps.map((map) => map.assemble[1])],
  ];

  let appliedSpectrum: string | null = null;
  let parity = 0;
  let disposed = false;

  function applyLiveParameters(next: SimulationParameters): void {
    applyLiveSpectrumParameters(spectrum, next);
    assemble.lambda.value = next.lambda;
    assemble.foamDecay.value = next.foamDecay;
    assemble.foamSpread.value = next.foamSpread;
    const direction = (next.local.windDirection * Math.PI) / 180;
    const speed = FOAM_DRIFT_FRACTION * next.local.windSpeed;
    assemble.drift.value.set(
      speed * Math.cos(direction),
      speed * Math.sin(direction)
    );
  }

  function rebuildSpectrum(next: SimulationParameters): void {
    const key = spectrumKey(next);
    if (key === appliedSpectrum) return;
    if (noiseSeed !== next.seed) {
      noise.value.array.set(gaussianNoise(size, next.seed));
      noise.value.needsUpdate = true;
      noiseSeed = next.seed;
    }
    applyInitialSpectrumParameters(spectrum, next);
    renderer.compute(spectrumNodes);
    appliedSpectrum = key;
  }

  return {
    cascades: cascades.map((cascade, index) => ({
      size,
      lengthScale: cascade.lengthScale,
      displacement: maps[index].displacement,
      derivatives: maps[index].derivatives,
    })),

    setParameters(next) {
      if (disposed) return;
      applyLiveParameters(next);
      rebuildSpectrum(next);
    },

    reset() {
      assemble.reset.value = 1;
    },

    step(stepTime, dt) {
      if (disposed) return;
      time.value = stepTime;
      assemble.dt.value = Math.max(dt, 0);
      renderer.compute(stepGroups[parity]);
      parity = 1 - parity;
      assemble.reset.value = 0;
    },

    dispose() {
      disposed = true;
      for (const node of spectrumNodes) node.dispose();
      for (const node of stepNodes) node.dispose();
      for (const map of maps) map.dispose();
    },
  };
}

function range(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index);
}
