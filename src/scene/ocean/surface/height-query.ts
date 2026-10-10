import {
  attributeArray,
  Fn,
  If,
  instanceIndex,
  uint,
  uniform,
} from "three/tsl";
import {
  ReadbackBuffer,
  type Texture,
  type WebGPURenderer,
} from "three/webgpu";

import type { Disposable } from "../../use-disposable";
import type { OceanCascadeMaps } from "../simulation/ocean-simulation";
import {
  HEIGHT_QUERY_CAPACITY,
  HEIGHT_QUERY_ITERATIONS,
  HEIGHT_QUERY_SLOTS,
} from "./constants";
import { sampleDisplacement } from "./waves";

export type HeightQueryCallback = (
  heights: Float32Array,
  count: number,
  token: number
) => void;

export interface HeightQuery extends Disposable {
  readonly capacity: number;
  readonly input: Float32Array;
  submit(count: number, token: number, onResult: HeightQueryCallback): boolean;
}

interface ReadbackSlot {
  readonly target: ReadbackBuffer;
  readonly heights: Float32Array;
  busy: boolean;
}

const POINT_STRIDE = 4;

export function createHeightQuery(
  renderer: WebGPURenderer,
  cascades: readonly OceanCascadeMaps[],
  detail: Texture
): HeightQuery {
  const capacity = HEIGHT_QUERY_CAPACITY;
  const points = attributeArray(capacity, "vec4");
  const heights = attributeArray(capacity, "float");
  const limit = uniform(0);
  const slots: readonly ReadbackSlot[] = Array.from(
    { length: HEIGHT_QUERY_SLOTS },
    () => ({
      target: new ReadbackBuffer(capacity * Float32Array.BYTES_PER_ELEMENT),
      heights: new Float32Array(capacity),
      busy: false,
    })
  );
  let disposed = false;

  const compute = Fn(() => {
    If(instanceIndex.lessThan(uint(limit)), () => {
      const point = points.element(instanceIndex).toVar();
      const target = point.xy.toVar();
      const spacing = point.z.toVar();
      const rest = target.toVar();
      for (let step = 0; step < HEIGHT_QUERY_ITERATIONS; step++) {
        rest.assign(
          target.sub(
            sampleDisplacement({ cascades, detail, worldXZ: rest, spacing }).xz
          )
        );
      }
      heights
        .element(instanceIndex)
        .assign(
          sampleDisplacement({ cascades, detail, worldXZ: rest, spacing }).y
        );
    });
  })().compute(capacity);

  function freeSlot(): ReadbackSlot | null {
    for (const slot of slots) {
      if (!slot.busy) return slot;
    }
    return null;
  }

  return {
    capacity,
    input: points.value.array as Float32Array,

    submit(count, token, onResult) {
      if (disposed || count <= 0 || count > capacity) return false;
      const slot = freeSlot();
      if (slot === null) return false;

      const attribute = points.value;
      attribute.clearUpdateRanges();
      attribute.addUpdateRange(0, count * POINT_STRIDE);
      attribute.needsUpdate = true;
      limit.value = count;
      renderer.compute(compute, count);

      slot.busy = true;
      renderer
        .getArrayBufferAsync(
          heights.value,
          slot.target,
          0,
          count * Float32Array.BYTES_PER_ELEMENT
        )
        .then(
          (target) => {
            try {
              if (!disposed && target.buffer !== null) {
                slot.heights.set(new Float32Array(target.buffer, 0, count));
                onResult(slot.heights, count, token);
              }
            } finally {
              target.release();
              slot.busy = false;
            }
          },
          () => {
            slot.target.release();
            slot.busy = false;
          }
        );
      return true;
    },

    dispose() {
      disposed = true;
      compute.dispose();
      for (const slot of slots) slot.target.dispose();
    },
  };
}
