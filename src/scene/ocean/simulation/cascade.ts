import { attributeArray, uniform } from "three/tsl";
import type { ComputeNode, StorageBufferNode, UniformNode } from "three/webgpu";

import {
  buildConjugate,
  buildInitialSpectrum,
  buildTimeDependent,
  type SpectrumFields,
  type SpectrumUniforms,
} from "./spectrum";

export interface Cascade {
  readonly size: number;
  readonly lengthScale: number;
  readonly fields: SpectrumFields;
  readonly initial: ComputeNode;
  readonly conjugate: ComputeNode;
  readonly timeDependent: ComputeNode;
}

interface CascadeOptions {
  size: number;
  lengthScale: number;
  cutoffLow: number;
  cutoffHigh: number;
  noise: StorageBufferNode<"vec2">;
  uniforms: SpectrumUniforms;
  time: UniformNode<"float", number>;
}

export function createCascade({
  size,
  lengthScale,
  cutoffLow,
  cutoffHigh,
  noise,
  uniforms,
  time,
}: CascadeOptions): Cascade {
  const count = size * size;
  const h0k = attributeArray(count, "vec2");
  const h0 = attributeArray(count, "vec4");
  const wavesData = attributeArray(count, "vec4");
  const fields: SpectrumFields = {
    DxDz: attributeArray(count, "vec2"),
    DyDxz: attributeArray(count, "vec2"),
    DyxDyz: attributeArray(count, "vec2"),
    DxxDzz: attributeArray(count, "vec2"),
  };

  return {
    size,
    lengthScale,
    fields,
    initial: buildInitialSpectrum({
      size,
      noise,
      h0k,
      wavesData,
      uniforms,
      deltaK: uniform((2 * Math.PI) / lengthScale),
      cutoffLow: uniform(cutoffLow),
      cutoffHigh: uniform(cutoffHigh),
    }),
    conjugate: buildConjugate({ size, h0k, h0 }),
    timeDependent: buildTimeDependent({
      size,
      h0,
      wavesData,
      ...fields,
      uniforms,
      time,
    }),
  };
}
