import {
  AtmosphereLightNode as TakramAtmosphereLightNode,
  skyBackground as takramSkyBackground,
  skyEnvironment as takramSkyEnvironment,
  type AtmosphereLight,
} from "@takram/three-atmosphere/webgpu";
import type { AnalyticLightNode, Node } from "three/webgpu";

import type { Disposable } from "../use-disposable";

export {
  getECIToECEFRotationMatrix,
  getMoonDirectionECI,
  getSunDirectionECI,
} from "@takram/three-atmosphere";
export {
  AtmosphereContext,
  AtmosphereLight,
} from "@takram/three-atmosphere/webgpu";
export { Ellipsoid, Geodetic, radians } from "@takram/three-geospatial";

export const AtmosphereLightNode = TakramAtmosphereLightNode as unknown as new (
  light: AtmosphereLight
) => AnalyticLightNode<AtmosphereLight>;

export const skyBackground = takramSkyBackground as unknown as () => Node &
  Disposable & { showStars: boolean; starsNode: Disposable };

export const skyEnvironment =
  takramSkyEnvironment as unknown as () => Node<"vec3"> & Disposable;
