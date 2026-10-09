import {
  abs,
  atan,
  cos,
  cosh,
  exp,
  float,
  Fn,
  instanceIndex,
  int,
  length,
  max,
  min,
  mix,
  pow,
  sin,
  sqrt,
  step,
  tanh,
  uint,
  uniform,
  vec2,
  vec4,
} from "three/tsl";
import type {
  ComputeNode,
  Node,
  StorageBufferNode,
  UniformNode,
} from "three/webgpu";

import { complexMul } from "./complex";
import type {
  SimulationParameters,
  SwellParameters,
  WaveSystemParameters,
} from "./config";

type FloatNode = Node<"float">;
type FloatUniform = UniformNode<"float", number>;

export interface WaveSystemUniforms {
  scale: FloatUniform;
  angle: FloatUniform;
  spreadBlend: FloatUniform;
  swell: FloatUniform;
  alpha: FloatUniform;
  peakOmega: FloatUniform;
  gamma: FloatUniform;
  shortWavesFade: FloatUniform;
  tailFalloff: FloatUniform;
  tailFloor: FloatUniform;
}

export interface SpectrumUniforms {
  g: FloatUniform;
  depth: FloatUniform;
  chopFalloff: FloatUniform;
  chopFloor: FloatUniform;
  chopLean: FloatUniform;
  windX: FloatUniform;
  windZ: FloatUniform;
  local: WaveSystemUniforms;
  swell: WaveSystemUniforms;
}

export interface SpectrumFields {
  DxDz: StorageBufferNode<"vec2">;
  DyDxz: StorageBufferNode<"vec2">;
  DyxDyz: StorageBufferNode<"vec2">;
  DxxDzz: StorageBufferNode<"vec2">;
}

const SWELL_REF_WIND = 10.5;

export function createSpectrumUniforms(): SpectrumUniforms {
  return {
    g: uniform(0),
    depth: uniform(0),
    chopFalloff: uniform(0),
    chopFloor: uniform(0),
    chopLean: uniform(0),
    windX: uniform(0),
    windZ: uniform(0),
    local: createWaveSystemUniforms(),
    swell: createWaveSystemUniforms(),
  };
}

export function applyLiveSpectrumParameters(
  uniforms: SpectrumUniforms,
  parameters: SimulationParameters
): void {
  uniforms.chopFalloff.value = parameters.chopFalloff;
  uniforms.chopFloor.value = parameters.chopFloor;
  uniforms.chopLean.value = parameters.chopLean;
  const windDirection = (parameters.local.windDirection * Math.PI) / 180;
  uniforms.windX.value = Math.cos(windDirection);
  uniforms.windZ.value = Math.sin(windDirection);
}

export function applyInitialSpectrumParameters(
  uniforms: SpectrumUniforms,
  parameters: SimulationParameters
): void {
  uniforms.g.value = parameters.g;
  uniforms.depth.value = parameters.depth;
  fillWaveSystem(uniforms.local, parameters.local, parameters.g, 1);
  fillWaveSystem(
    uniforms.swell,
    parameters.swell,
    parameters.g,
    swellWindCoupling(parameters.swell, parameters.local)
  );
}

interface InitialSpectrumOptions {
  size: number;
  noise: StorageBufferNode<"vec2">;
  h0k: StorageBufferNode<"vec2">;
  wavesData: StorageBufferNode<"vec4">;
  uniforms: SpectrumUniforms;
  deltaK: FloatUniform;
  cutoffLow: FloatUniform;
  cutoffHigh: FloatUniform;
}

export function buildInitialSpectrum({
  size,
  noise,
  h0k,
  wavesData,
  uniforms,
  deltaK,
  cutoffLow,
  cutoffHigh,
}: InitialSpectrumOptions): ComputeNode {
  return Fn(() => {
    const id = instanceIndex;
    const x = id.mod(uint(size));
    const y = id.div(uint(size));
    const nx = float(int(x).sub(size / 2));
    const nz = float(int(y).sub(size / 2));
    const k = vec2(nx, nz).mul(deltaK);
    const kLength = length(k);
    const kSafe = max(kLength, cutoffLow);
    const angle = atan(k.y, k.x.add(1e-9));
    const omega = frequency(kSafe, uniforms.g, uniforms.depth);
    const dOmega = frequencyDerivative(kSafe, uniforms.g, uniforms.depth);

    const spectrum = jonswap(omega, uniforms.g, uniforms.depth, uniforms.local)
      .mul(directionSpectrum(angle, omega, uniforms.local))
      .mul(shortWavesFade(kSafe, uniforms.local))
      .add(
        jonswap(omega, uniforms.g, uniforms.depth, uniforms.swell)
          .mul(directionSpectrum(angle, omega, uniforms.swell))
          .mul(shortWavesFade(kSafe, uniforms.swell))
      );

    const inBand = step(cutoffLow, kLength).mul(step(kLength, cutoffHigh));
    const amplitude = sqrt(
      spectrum.mul(2).mul(abs(dOmega)).div(kSafe).mul(deltaK).mul(deltaK)
    );

    h0k.element(id).assign(noise.element(id).mul(amplitude).mul(inBand));
    wavesData.element(id).assign(vec4(k.x, float(1).div(kSafe), k.y, omega));
  })().compute(size * size);
}

interface ConjugateOptions {
  size: number;
  h0k: StorageBufferNode<"vec2">;
  h0: StorageBufferNode<"vec4">;
}

export function buildConjugate({
  size,
  h0k,
  h0,
}: ConjugateOptions): ComputeNode {
  return Fn(() => {
    const id = instanceIndex;
    const x = id.mod(uint(size));
    const y = id.div(uint(size));
    const xm = uint(size).sub(x).mod(uint(size));
    const ym = uint(size).sub(y).mod(uint(size));
    const idConjugate = ym.mul(uint(size)).add(xm);
    const a = h0k.element(id);
    const b = h0k.element(idConjugate);
    h0.element(id).assign(vec4(a.x, a.y, b.x, b.y.negate()));
  })().compute(size * size);
}

interface TimeDependentOptions extends SpectrumFields {
  size: number;
  h0: StorageBufferNode<"vec4">;
  wavesData: StorageBufferNode<"vec4">;
  uniforms: SpectrumUniforms;
  time: FloatUniform;
}

export function buildTimeDependent({
  size,
  h0,
  wavesData,
  DxDz,
  DyDxz,
  DyxDyz,
  DxxDzz,
  uniforms,
  time,
}: TimeDependentOptions): ComputeNode {
  return Fn(() => {
    const id = instanceIndex;
    const wave = wavesData.element(id);
    const phase = wave.w.mul(time);
    const ex = vec2(cos(phase), sin(phase));
    const h0v = h0.element(id);
    const h = complexMul(h0v.xy, ex).add(
      complexMul(h0v.zw, vec2(ex.x, ex.y.negate()))
    );
    const ih = vec2(h.y.negate(), h.x);

    const kInverse = wave.y;
    const kHat = vec2(wave.x, wave.z).mul(kInverse);
    const chop = choppiness(float(1).div(kInverse), uniforms).toVar();
    const lean = leanWeight(kHat, chop, uniforms).toVar();
    const hc = complexMul(h, vec2(lean, chop)).toVar();
    const ihc = vec2(hc.y.negate(), hc.x).toVar();

    const dispX = hc.mul(wave.x).mul(kInverse);
    const dispY = h;
    const dispZ = hc.mul(wave.z).mul(kInverse);
    const dispXdx = ihc.mul(wave.x).mul(wave.x).mul(kInverse);
    const dispYdx = ih.mul(wave.x);
    const dispZdx = ihc.mul(wave.x).mul(wave.z).mul(kInverse);
    const dispYdz = ih.mul(wave.z);
    const dispZdz = ihc.mul(wave.z).mul(wave.z).mul(kInverse);

    DxDz.element(id).assign(vec2(dispX.x.sub(dispZ.y), dispX.y.add(dispZ.x)));
    DyDxz.element(id).assign(
      vec2(dispY.x.sub(dispZdx.y), dispY.y.add(dispZdx.x))
    );
    DyxDyz.element(id).assign(
      vec2(dispYdx.x.sub(dispYdz.y), dispYdx.y.add(dispYdz.x))
    );
    DxxDzz.element(id).assign(
      vec2(dispXdx.x.sub(dispZdz.y), dispXdx.y.add(dispZdz.x))
    );
  })().compute(size * size);
}

function createWaveSystemUniforms(): WaveSystemUniforms {
  return {
    scale: uniform(0),
    angle: uniform(0),
    spreadBlend: uniform(0),
    swell: uniform(0),
    alpha: uniform(0),
    peakOmega: uniform(0),
    gamma: uniform(0),
    shortWavesFade: uniform(0),
    tailFalloff: uniform(0),
    tailFloor: uniform(0),
  };
}

function fillWaveSystem(
  target: WaveSystemUniforms,
  source: WaveSystemParameters,
  g: number,
  scaleMultiplier: number
): void {
  target.scale.value = source.scale * scaleMultiplier;
  target.angle.value = (source.windDirection * Math.PI) / 180;
  target.spreadBlend.value = source.spreadBlend;
  target.swell.value = Math.min(Math.max(source.swell, 0.01), 1);
  target.alpha.value =
    0.076 *
    Math.pow((g * source.fetch) / (source.windSpeed * source.windSpeed), -0.22);
  target.peakOmega.value =
    22 * Math.pow((source.windSpeed * source.fetch) / (g * g), -0.33);
  target.gamma.value = source.peakEnhancement;
  target.shortWavesFade.value = source.shortWavesFade;
  target.tailFalloff.value = source.tailFalloff;
  target.tailFloor.value = source.tailFloor;
}

function swellWindCoupling(
  swell: SwellParameters,
  local: WaveSystemParameters
): number {
  if (swell.windCoupling === 0) return 1;
  const ratio = Math.min(Math.max(local.windSpeed / SWELL_REF_WIND, 0.35), 1.7);
  return Math.pow(ratio, swell.windCoupling);
}

function frequency(k: FloatNode, g: FloatNode, depth: FloatNode): FloatNode {
  return sqrt(g.mul(k).mul(tanh(min(k.mul(depth), float(20)))));
}

function frequencyDerivative(
  k: FloatNode,
  g: FloatNode,
  depth: FloatNode
): FloatNode {
  const th = tanh(min(k.mul(depth), float(20)));
  const ch = cosh(k.mul(depth));
  const f = frequency(k, g, depth);
  return g.mul(depth.mul(k).div(ch).div(ch).add(th)).div(f).div(2);
}

function normalisationFactor(s: FloatNode): FloatNode {
  const s2 = s.mul(s);
  const s3 = s2.mul(s);
  const s4 = s3.mul(s);
  const a = s4
    .mul(-0.000564)
    .add(s3.mul(0.00776))
    .add(s2.mul(-0.044))
    .add(s.mul(0.192))
    .add(0.163);
  const b = s4
    .mul(-4.8e-8)
    .add(s3.mul(1.07e-5))
    .add(s2.mul(-9.53e-4))
    .add(s.mul(5.9e-2))
    .add(3.93e-1);
  return mix(a, b, step(float(5), s));
}

function cosine2s(theta: FloatNode, s: FloatNode): FloatNode {
  return normalisationFactor(s).mul(pow(abs(cos(theta.mul(0.5))), s.mul(2)));
}

function spreadPower(omega: FloatNode, peakOmega: FloatNode): FloatNode {
  const r = omega.div(peakOmega);
  const high = pow(abs(r), float(-2.5)).mul(9.77);
  const low = pow(abs(r), float(5)).mul(6.97);
  return mix(low, high, step(peakOmega, omega));
}

function swellConcentration(
  omega: FloatNode,
  system: WaveSystemUniforms
): FloatNode {
  const r = omega.div(system.peakOmega);
  return tanh(min(r, float(20))).mul(
    min(float(1).div(max(r, float(1e-3))), float(1))
  );
}

function directionSpectrum(
  theta: FloatNode,
  omega: FloatNode,
  system: WaveSystemUniforms
): FloatNode {
  const s = spreadPower(omega, system.peakOmega).add(
    swellConcentration(omega, system)
      .mul(16)
      .mul(system.swell)
      .mul(system.swell)
  );
  const base = cos(theta)
    .mul(cos(theta))
    .mul(2 / Math.PI);
  return mix(base, cosine2s(theta.sub(system.angle), s), system.spreadBlend);
}

function tmaCorrection(
  omega: FloatNode,
  g: FloatNode,
  depth: FloatNode
): FloatNode {
  const omegaH = omega.mul(sqrt(depth.div(g)));
  const c1 = omegaH.mul(omegaH).mul(0.5);
  const tw = float(2).sub(omegaH);
  const c2 = float(1).sub(tw.mul(tw).mul(0.5));
  return mix(
    c1,
    mix(c2, float(1), step(float(2), omegaH)),
    step(float(1), omegaH)
  );
}

function tailRolloff(omega: FloatNode, system: WaveSystemUniforms): FloatNode {
  return pow(
    max(min(system.peakOmega.div(omega), float(1)), system.tailFloor),
    system.tailFalloff
  );
}

function jonswap(
  omega: FloatNode,
  g: FloatNode,
  depth: FloatNode,
  system: WaveSystemUniforms
): FloatNode {
  const sigma = mix(float(0.07), float(0.09), step(system.peakOmega, omega));
  const dw = omega.sub(system.peakOmega);
  const r = exp(
    dw
      .mul(dw)
      .mul(-1)
      .div(sigma.mul(sigma).mul(system.peakOmega).mul(system.peakOmega).mul(2))
  );
  const oo = float(1).div(omega);
  const oo2 = oo.mul(oo);
  const oo5 = oo2.mul(oo2).mul(oo);
  const po = system.peakOmega.div(omega);
  const po2 = po.mul(po);
  const po4 = po2.mul(po2);
  return system.scale
    .mul(tmaCorrection(omega, g, depth))
    .mul(system.alpha)
    .mul(g)
    .mul(g)
    .mul(oo5)
    .mul(exp(po4.mul(-1.25)))
    .mul(pow(system.gamma, r))
    .mul(tailRolloff(omega, system));
}

function shortWavesFade(
  kLength: FloatNode,
  system: WaveSystemUniforms
): FloatNode {
  return exp(
    system.shortWavesFade
      .mul(system.shortWavesFade)
      .mul(kLength)
      .mul(kLength)
      .mul(-1)
  );
}

function choppiness(kLength: FloatNode, uniforms: SpectrumUniforms): FloatNode {
  const r = kLength.div(uniforms.chopFalloff);
  const r2 = r.mul(r);
  return uniforms.chopFloor.add(
    float(1).sub(uniforms.chopFloor).div(r2.mul(r2).add(1))
  );
}

function leanWeight(
  kHat: Node<"vec2">,
  chop: FloatNode,
  uniforms: SpectrumUniforms
): FloatNode {
  return kHat.x
    .mul(uniforms.windX)
    .add(kHat.y.mul(uniforms.windZ))
    .mul(uniforms.chopLean)
    .mul(chop);
}
