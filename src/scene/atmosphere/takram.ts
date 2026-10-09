import {
  aerialPerspective as takramAerialPerspective,
  type AtmosphereContext as TakramAtmosphereContext,
  AtmosphereLightNode as TakramAtmosphereLightNode,
  getAtmosphereContext as takramGetAtmosphereContext,
  skyEnvironment as takramSkyEnvironment,
  StarsNode as TakramStarsNode,
  type AtmosphereLight,
} from "@takram/three-atmosphere/webgpu";
import type {
  AnalyticLightNode,
  Node,
  NodeBuilder,
  TextureNode,
} from "three/webgpu";

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

export interface StarsNode extends Disposable {
  readonly intensity: { value: number };
}

export interface SkyNode extends Disposable {
  showStars: boolean;
  starsNode: StarsNode;
}

export type AerialPerspectiveNode = Node<"vec4"> &
  Disposable & {
    readonly skyNode: SkyNode;
  };

export interface AtmosphereBuildContext {
  readonly matrixWorldToECEF: Node<"mat4">;
  readonly altitudeCorrectionECEF: Node<"vec3">;
  readonly correctAltitude: boolean;
}

export const AtmosphereLightNode = TakramAtmosphereLightNode as unknown as new (
  light: AtmosphereLight
) => AnalyticLightNode<AtmosphereLight>;

export const getAtmosphereContext = takramGetAtmosphereContext as unknown as (
  builder: NodeBuilder
) => AtmosphereBuildContext;

export const aerialPerspective = takramAerialPerspective as unknown as (
  color: Node<"vec4">,
  depth: TextureNode,
  normal: null,
  shadowLength: Node<"vec2"> | null
) => AerialPerspectiveNode;

export const StarsNode = TakramStarsNode as unknown as new (
  url: string
) => StarsNode;

export const skyEnvironment =
  takramSkyEnvironment as unknown as () => Node<"vec3"> & Disposable;

interface LUTUpdateTarget {
  addEventListener(type: "update", listener: () => void): void;
  removeEventListener(type: "update", listener: () => void): void;
}

export function onLUTUpdate(
  atmosphere: TakramAtmosphereContext,
  listener: () => void
): () => void {
  const target = atmosphere.lutNode as unknown as LUTUpdateTarget;
  target.addEventListener("update", listener);
  return () => target.removeEventListener("update", listener);
}
