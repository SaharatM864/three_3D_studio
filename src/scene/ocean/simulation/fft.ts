import {
  attributeArray,
  float,
  Fn,
  instanceIndex,
  uint,
  vec2,
} from "three/tsl";
import type { ComputeNode, Node, StorageBufferNode } from "three/webgpu";

import { complexMul } from "./complex";

type Axis = "horizontal" | "vertical";

export interface FFTPasses {
  horizontal: readonly ComputeNode[];
  vertical: readonly ComputeNode[];
  permute: ComputeNode;
}

export interface FFT {
  readonly logSize: number;
  buildField(
    field: StorageBufferNode<"vec2">,
    scratch: StorageBufferNode<"vec2">
  ): FFTPasses;
}

export function createFFT(size: number): FFT {
  const logSize = Math.log2(size);
  if (!Number.isInteger(logSize) || logSize % 2 !== 0) {
    throw new Error(
      `Invalid ocean FFT size ${size}: log2(size) must be an even integer`
    );
  }
  const butterfly = attributeArray(logSize * size, "vec4");
  fillButterfly(butterfly.value.array as Float32Array, size);
  butterfly.value.needsUpdate = true;

  function butterflyStep(
    field: StorageBufferNode<"vec2">,
    scratch: StorageBufferNode<"vec2">,
    stage: number,
    axis: Axis
  ): ComputeNode {
    const source = stage % 2 === 0 ? field : scratch;
    const target = stage % 2 === 0 ? scratch : field;
    return Fn(() => {
      const id = instanceIndex;
      const x = id.mod(uint(size));
      const y = id.div(uint(size));
      const data = butterfly.element(
        uint(stage * size).add(axis === "horizontal" ? x : y)
      );
      const twiddle = vec2(data.x, data.y.negate());
      const sample = (index: Node<"uint">) =>
        source.element(
          axis === "horizontal"
            ? y.mul(size).add(index)
            : index.mul(size).add(x)
        );
      const a = sample(uint(data.z));
      const b = sample(uint(data.w));
      target.element(id).assign(a.add(complexMul(twiddle, b)));
    })().compute(size * size);
  }

  function permute(field: StorageBufferNode<"vec2">): ComputeNode {
    return Fn(() => {
      const id = instanceIndex;
      const x = id.mod(uint(size));
      const y = id.div(uint(size));
      const sign = float(1).sub(float(x.add(y).mod(uint(2))).mul(2));
      field.element(id).assign(field.element(id).mul(sign));
    })().compute(size * size);
  }

  return {
    logSize,
    buildField(field, scratch) {
      const horizontal: ComputeNode[] = [];
      const vertical: ComputeNode[] = [];
      for (let stage = 0; stage < logSize; stage++) {
        horizontal.push(butterflyStep(field, scratch, stage, "horizontal"));
        vertical.push(butterflyStep(field, scratch, stage, "vertical"));
      }
      return { horizontal, vertical, permute: permute(field) };
    },
  };
}

function fillButterfly(array: Float32Array, size: number): void {
  const logSize = Math.log2(size);
  for (let stage = 0; stage < logSize; stage++) {
    const span = size >> (stage + 1);
    for (let j = 0; j < size / 2; j++) {
      const i = (2 * span * Math.floor(j / span) + (j % span)) % size;
      const x = Math.floor(j / span) * span;
      const re = Math.cos((2 * Math.PI * x) / size);
      const im = -Math.sin((2 * Math.PI * x) / size);
      writeButterfly(array, size, stage, j, re, im, i, i + span);
      writeButterfly(array, size, stage, j + size / 2, -re, -im, i, i + span);
    }
  }
}

function writeButterfly(
  array: Float32Array,
  size: number,
  stage: number,
  column: number,
  re: number,
  im: number,
  a: number,
  b: number
): void {
  const offset = (stage * size + column) * 4;
  array[offset] = re;
  array[offset + 1] = im;
  array[offset + 2] = a;
  array[offset + 3] = b;
}
