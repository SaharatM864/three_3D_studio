import type { Vector2 } from "three";
import {
  exp,
  float,
  Fn,
  instanceIndex,
  max,
  min,
  mix,
  select,
  sqrt,
  texture,
  textureStore,
  uint,
  uvec2,
  vec2,
  vec4,
} from "three/tsl";
import {
  HalfFloatType,
  LinearFilter,
  RepeatWrapping,
  StorageTexture,
  type ComputeNode,
  type UniformNode,
} from "three/webgpu";

import type { Disposable } from "../../use-disposable";
import type { Cascade } from "./cascade";
import { foamLifetimeScale } from "./config";

const BLUR_WEIGHT_MAX = 0.3;
const TAU_FLOOR = 1e-3;
const FOAM_TAU_STEPS = 1500;
const FOAM_MAX = 8;
const FOAM_INJECT_GAIN = 1.048;

export interface AssembleUniforms {
  lambda: UniformNode<"float", number>;
  dt: UniformNode<"float", number>;
  foamDecay: UniformNode<"float", number>;
  foamSpread: UniformNode<"float", number>;
  drift: UniformNode<"vec2", Vector2>;
  reset: UniformNode<"float", number>;
}

export interface CascadeMaps extends Disposable {
  readonly displacement: StorageTexture;
  readonly derivatives: StorageTexture;
  readonly assemble: readonly [ComputeNode, ComputeNode];
}

export function createCascadeMaps(
  cascade: Cascade,
  { lambda, dt, foamDecay, foamSpread, drift, reset }: AssembleUniforms
): CascadeMaps {
  const { size, lengthScale, fields } = cascade;
  const tauScale = foamLifetimeScale(lengthScale);
  const displacement = mapTexture(size);
  const derivatives = mapTexture(size);
  const history = [historyTexture(size), historyTexture(size)] as const;

  const buildAssemble = (read: 0 | 1, write: 0 | 1) =>
    Fn(() => {
      const id = instanceIndex;
      const coord = uvec2(id.mod(uint(size)), id.div(uint(size)));
      const DxDz = fields.DxDz.element(id);
      const DyDxz = fields.DyDxz.element(id);
      const DyxDyz = fields.DyxDyz.element(id);
      const DxxDzz = fields.DxxDzz.element(id);

      const jxx = float(1).add(lambda.mul(DxxDzz.x));
      const jzz = float(1).add(lambda.mul(DxxDzz.y));
      const jxz = lambda.mul(DyDxz.y);
      const half = jxx.add(jzz).mul(0.5);
      const disc = sqrt(
        jxx.sub(jzz).mul(jxx.sub(jzz)).add(jxz.mul(jxz).mul(4))
      ).mul(0.5);
      const lMin = half.sub(disc);

      const uv = vec2(float(coord.x), float(coord.y))
        .add(0.5)
        .div(size)
        .sub(drift.mul(dt).div(lengthScale));
      const texel = float(1 / size);
      const tap = (ox: number, oy: number) =>
        texture(
          history[read],
          uv.add(vec2(texel.mul(ox), texel.mul(oy))),
          float(0)
        ).x;
      const tent = tap(0.5, 0.5)
        .add(tap(-0.5, 0.5))
        .add(tap(0.5, -0.5))
        .add(tap(-0.5, -0.5))
        .mul(0.25);
      const blurWeight = min(dt.mul(foamSpread), float(BLUR_WEIGHT_MAX));
      const previous = select(
        reset.greaterThan(0.5),
        float(0),
        mix(tap(0, 0), tent, blurWeight)
      );
      const tau = max(
        min(foamDecay.mul(tauScale), dt.mul(FOAM_TAU_STEPS)),
        float(TAU_FLOOR)
      ).toVar();
      const decayed = previous.mul(exp(dt.negate().div(tau)));
      const injected = min(
        float(1).sub(lMin).mul(FOAM_INJECT_GAIN),
        float(FOAM_MAX)
      );
      const foam = max(injected, decayed).toVar();
      const turbulence = float(1).sub(foam).toVar();

      textureStore(history[write], coord, vec4(foam, 0, 0, 1)).toWriteOnly();
      textureStore(
        displacement,
        coord,
        vec4(DxDz.x.mul(lambda), DyDxz.x, DxDz.y.mul(lambda), turbulence)
      ).toWriteOnly();
      textureStore(
        derivatives,
        coord,
        vec4(DyxDyz.x, DyxDyz.y, DxxDzz.x.mul(lambda), DxxDzz.y.mul(lambda))
      ).toWriteOnly();
    })().compute(size * size);

  const assemble = [buildAssemble(0, 1), buildAssemble(1, 0)] as const;

  return {
    displacement,
    derivatives,
    assemble,
    dispose() {
      for (const node of assemble) node.dispose();
      displacement.dispose();
      derivatives.dispose();
      for (const map of history) map.dispose();
    },
  };
}

function mapTexture(size: number): StorageTexture {
  const map = new StorageTexture(size, size);
  map.type = HalfFloatType;
  map.wrapS = RepeatWrapping;
  map.wrapT = RepeatWrapping;
  return map;
}

function historyTexture(size: number): StorageTexture {
  const map = mapTexture(size);
  map.generateMipmaps = false;
  map.minFilter = LinearFilter;
  map.magFilter = LinearFilter;
  return map;
}
