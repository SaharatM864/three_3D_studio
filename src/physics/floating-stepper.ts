import { FLOATING_MAX_STEPS, FLOATING_STEP } from "./constants";
import type { FloatingBody } from "./floating-body";
import type { WaterSource } from "./water";

export interface FloatingEntry {
  readonly id: string;
  readonly body: FloatingBody;
}

export interface FloatingStepper {
  advance(
    entries: readonly FloatingEntry[],
    dt: number,
    endTime: number,
    water: WaterSource
  ): boolean;
  reset(): void;
}

export function createFloatingStepper(): FloatingStepper {
  let accumulator = 0;

  return {
    advance(entries, dt, endTime, water) {
      if (!(dt > 0)) return false;
      accumulator = Math.min(
        accumulator + dt,
        FLOATING_STEP * FLOATING_MAX_STEPS
      );
      let stepped = false;
      while (accumulator >= FLOATING_STEP) {
        accumulator -= FLOATING_STEP;
        water.setTime(endTime - accumulator);
        for (const { id, body } of entries) {
          const surface = water.surface(id);
          if (surface === null) continue;
          body.step(FLOATING_STEP, surface);
          stepped = true;
        }
      }
      return stepped;
    },

    reset() {
      accumulator = 0;
    },
  };
}
