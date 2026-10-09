import {
  dithering as takramDithering,
  highpVelocity as takramHighpVelocity,
  lensFlare as takramLensFlare,
  temporalAntialias as takramTemporalAntialias,
} from "@takram/three-geospatial/webgpu";
import type { Camera } from "three";
import type { Node, RTTNode, TextureNode } from "three/webgpu";

import type { Disposable } from "../use-disposable";

export const dithering = takramDithering as unknown as Node<"vec3">;

export type HighpVelocityNode = Node<"vec3"> & {
  readonly currentProjectionMatrix: Node<"mat4">;
  readonly previousProjectionMatrix: Node<"mat4">;
};

export const highpVelocity =
  takramHighpVelocity as unknown as HighpVelocityNode;

export const lensFlare = takramLensFlare as unknown as (
  input: Node
) => Node<"vec4"> & Disposable & { featuresNode: RTTNode; inputNode: RTTNode };

export const temporalAntialias = takramTemporalAntialias as unknown as (
  input: TextureNode,
  depth: TextureNode,
  velocity: TextureNode,
  camera: Camera
) => Node<"vec4"> & Disposable;
