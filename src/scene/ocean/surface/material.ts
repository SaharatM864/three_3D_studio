import {
  cameraPosition,
  float,
  Fn,
  length,
  max,
  mix,
  mrt,
  normalize,
  positionGeometry,
  positionWorld,
  vec2,
  vec3,
} from "three/tsl";
import { DoubleSide, MeshBasicNodeMaterial, type Texture } from "three/webgpu";

import type { OceanCascadeMaps } from "../simulation/ocean-simulation";
import { SAT_BOOST } from "./constants";
import { shadeFoam } from "./foam";
import {
  foamRoughness,
  shadeSkyReflection,
  shadeSunSpecular,
  type ViewGeometry,
} from "./reflection";
import { createSkyLight, luminance } from "./sky-light";
import { shadeUnderwater } from "./underwater";
import type { SurfaceUniforms } from "./uniforms";
import { surfaceVelocity } from "./velocity";
import { seaColors, shadeWaterBody } from "./water-body";
import {
  cameraWaterHeight,
  displacedPosition,
  sampleWaveForm,
  sampleWaveSurface,
  type WaveInputs,
} from "./waves";

export interface SurfaceMaterialOptions {
  cascades: readonly OceanCascadeMaps[];
  detail: Texture;
  uniforms: SurfaceUniforms;
}

export function createSurfaceMaterial({
  cascades,
  detail,
  uniforms,
}: SurfaceMaterialOptions): MeshBasicNodeMaterial {
  const material = new MeshBasicNodeMaterial();
  material.side = DoubleSide;
  material.fog = false;
  material.lights = false;

  const worldXZ = vec2(positionGeometry.x, positionGeometry.y).add(
    uniforms.originXZ
  );
  const waves: WaveInputs = { cascades, detail, worldXZ };

  material.positionNode = displacedPosition(waves);
  material.colorNode = Fn((builder) => {
    const light = createSkyLight(builder, uniforms.luminanceGain);
    const surface = sampleWaveSurface(waves, uniforms.time, uniforms.detail);
    const form = sampleWaveForm(waves, surface);
    const view = normalize(cameraPosition.sub(positionWorld)).toVar();
    const viewDistance = length(cameraPosition.sub(positionWorld)).toVar();
    const geometry: ViewGeometry = {
      normal: surface.normal,
      view,
      viewDistance,
      roughness: surface.roughness,
    };

    const reflection = shadeSkyReflection(geometry, light);
    const body = shadeWaterBody({
      detail,
      worldXZ,
      time: uniforms.time,
      normal: surface.normal,
      view,
      sea: seaColors(uniforms.palette),
      subsurface: uniforms.subsurface,
      form,
      light,
    });
    const reflected = reflection.radiance.mul(
      float(0.55).add(body.skyVisibility.mul(0.5))
    );
    const water = mix(body.color, reflected, reflection.fresnel).toVar();
    const saturation = mix(
      float(SAT_BOOST[0]),
      float(SAT_BOOST[1]),
      uniforms.palette
    );
    water.assign(max(mix(vec3(luminance(water)), water, saturation), vec3(0)));

    const specular = shadeSunSpecular(
      geometry,
      reflection.fresnelSpecular,
      foamRoughness(
        cascades,
        worldXZ,
        uniforms.foamThreshold,
        uniforms.foamScale
      ),
      light
    );
    water.addAssign(specular.total);

    const foamed = shadeFoam({
      cascades,
      detail,
      worldXZ,
      time: uniforms.time,
      normal: surface.normal,
      view,
      water,
      fresnel: reflection.fresnel,
      specularBroad: specular.broad,
      surface,
      body,
      foam: {
        threshold: uniforms.foamThreshold,
        scale: uniforms.foamScale,
        brightness: uniforms.foamBrightness,
        relief: uniforms.foamRelief,
        milk: uniforms.foamMilk,
      },
      light,
    });

    return shadeUnderwater({
      surface: foamed,
      normal: surface.normal,
      view,
      viewDistance,
      cameraWaterHeight: cameraWaterHeight(cascades, detail, uniforms.originXZ),
      body,
      light,
    }).mul(light.outputScale);
  })();
  material.mrtNode = mrt({ velocity: surfaceVelocity(uniforms.previousView) });

  return material;
}
