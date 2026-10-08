import {
  HalfFloatType,
  Matrix4,
  Vector2,
  Vector3,
  type Camera,
  type Data3DTexture,
  type Scene,
  type WebGLRenderer,
} from "three";

import type { GeoLocation } from "@/model/types";
import type { ResolvedClouds } from "@/presets/clouds";
import type { EvaluatedCloudMotion } from "@/timeline/types";

import {
  computeCelestialFrame,
  type CelestialFrame,
} from "../atmosphere/geo-frame";
import {
  loadCloudTextures,
  type CloudTextures,
} from "../clouds/cloud-textures";
import { configureSunShadow } from "../lights/sun-shadow";
import { SUN_SHADOW } from "../render-config";
import type { Disposable } from "../use-disposable";
import { applyCloudMotion, applyClouds, applyCloudsQuality } from "./clouds";
import {
  AerialPerspectiveEffect,
  CloudsEffect,
  DEFAULT_STBN_URL,
  EffectComposer,
  EffectPass,
  PrecomputedTexturesGenerator,
  RenderPass,
  SkyLightProbe,
  STBNLoader,
  SunDirectionalLight,
  ToneMappingEffect,
  ToneMappingMode,
} from "./takram";

export interface WebGLStageEnvironment {
  location: GeoLocation;
  epochMs: number;
}

export interface WebGLStageOptions {
  clouds: boolean;
}

export interface WebGLStageHandle extends Disposable {
  readonly sunLight: SunDirectionalLight;
  readonly skyLight: SkyLightProbe;
  readonly ready: Promise<void>;
  setEnvironment(environment: WebGLStageEnvironment): void;
  setExposure(exposure: number): void;
  setClouds(clouds: ResolvedClouds): void;
  setCloudMotion(motion: EvaluatedCloudMotion): void;
  resize(): void;
  render(): void;
}

interface CloudAssets extends Disposable {
  textures: CloudTextures;
  stbn: Data3DTexture;
}

export function createWebGLStage(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  options: WebGLStageOptions
): WebGLStageHandle {
  const generator = new PrecomputedTexturesGenerator(renderer);
  const luts = generator.textures;

  const sunLight = new SunDirectionalLight({ distance: SUN_SHADOW.distance });
  sunLight.transmittanceTexture = luts.transmittanceTexture;
  configureSunShadow(sunLight);
  const skyLight = new SkyLightProbe({
    irradianceTexture: luts.irradianceTexture,
  });

  const aerialPerspective = new AerialPerspectiveEffect(camera, {
    ...luts,
    sky: true,
    sunLight: false,
    skyLight: false,
    correctGeometricError: false,
  });

  const cloudsEffect = options.clouds ? new CloudsEffect(camera) : null;
  const syncCloudOutputs = () => {
    if (cloudsEffect === null) return;
    aerialPerspective.overlay = cloudsEffect.atmosphereOverlay;
    aerialPerspective.shadow = cloudsEffect.atmosphereShadow;
    aerialPerspective.shadowLength = cloudsEffect.atmosphereShadowLength;
  };
  if (cloudsEffect !== null) {
    applyCloudsQuality(cloudsEffect);
    Object.assign(cloudsEffect, luts);
    cloudsEffect.events.addEventListener("change", syncCloudOutputs);
    syncCloudOutputs();
  }

  const composer = new EffectComposer(renderer, {
    frameBufferType: HalfFloatType,
    multisampling: 0,
  });
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(
    cloudsEffect === null
      ? new EffectPass(camera, aerialPerspective)
      : new EffectPass(camera, cloudsEffect, aerialPerspective)
  );
  const toneMappingPass = new EffectPass(
    camera,
    new ToneMappingEffect({ mode: ToneMappingMode.AGX })
  );
  toneMappingPass.dithering = true;
  composer.addPass(toneMappingPass);

  const frame: CelestialFrame = {
    worldToECEF: new Matrix4(),
    eciToECEF: new Matrix4(),
    sunDirectionECEF: new Vector3(),
    moonDirectionECEF: new Vector3(),
  };
  const size = new Vector2();
  const updateLights = () => {
    sunLight.update();
    skyLight.update();
  };

  let disposed = false;
  let isReady = false;
  let assets: CloudAssets | null = null;

  const loadingAssets =
    cloudsEffect === null
      ? Promise.resolve(null)
      : loadCloudAssets().then((loaded) => {
          if (disposed) loaded.dispose();
          else assets = loaded;
          return loaded;
        });

  const ready = Promise.all([generator.update(), loadingAssets]).then(
    ([, loaded]) => {
      if (disposed) return;
      if (cloudsEffect !== null && loaded !== null) {
        cloudsEffect.localWeatherTexture = loaded.textures.localWeather;
        cloudsEffect.shapeTexture = loaded.textures.shape;
        cloudsEffect.shapeDetailTexture = loaded.textures.shapeDetail;
        cloudsEffect.turbulenceTexture = loaded.textures.turbulence;
        cloudsEffect.stbnTexture = loaded.stbn;
        aerialPerspective.stbnTexture = loaded.stbn;
      }
      updateLights();
      isReady = true;
    }
  );
  ready.catch(() => {});

  return {
    sunLight,
    skyLight,
    ready,

    setEnvironment({ location, epochMs }) {
      computeCelestialFrame(location, epochMs, frame);
      for (const target of [
        aerialPerspective,
        sunLight,
        skyLight,
        cloudsEffect,
      ]) {
        target?.worldToECEFMatrix.copy(frame.worldToECEF);
        target?.sunDirection.copy(frame.sunDirectionECEF);
      }
      aerialPerspective.moonDirection.copy(frame.moonDirectionECEF);
      updateLights();
    },

    setExposure(exposure) {
      renderer.toneMappingExposure = exposure;
    },

    setClouds(clouds) {
      if (cloudsEffect !== null) applyClouds(cloudsEffect, clouds);
    },

    setCloudMotion(motion) {
      if (cloudsEffect !== null) applyCloudMotion(cloudsEffect, motion);
    },

    resize() {
      const { x, y } = renderer.getSize(size);
      composer.setSize(x, y, false);
    },

    render() {
      if (isReady) composer.render(0);
    },

    dispose() {
      disposed = true;
      cloudsEffect?.events.removeEventListener("change", syncCloudOutputs);
      composer.dispose();
      generator.dispose();
      assets?.dispose();
      sunLight.dispose();
      skyLight.dispose();
    },
  };
}

async function loadCloudAssets(): Promise<CloudAssets> {
  // TODO(future): self-host stbn.bin (same-origin) once its license is cleared (takram issue #117).
  const [textures, stbn] = await Promise.allSettled([
    loadCloudTextures(),
    new STBNLoader().loadAsync(DEFAULT_STBN_URL),
  ]);
  if (textures.status === "rejected") {
    if (stbn.status === "fulfilled") stbn.value.dispose();
    throw textures.reason;
  }
  if (stbn.status === "rejected") {
    textures.value.dispose();
    throw stbn.reason;
  }

  const cloudTextures = textures.value;
  const stbnTexture = stbn.value;
  return {
    textures: cloudTextures,
    stbn: stbnTexture,
    dispose() {
      cloudTextures.dispose();
      stbnTexture.dispose();
    },
  };
}
