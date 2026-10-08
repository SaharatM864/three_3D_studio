import {
  dithering as takramDithering,
  lensFlare as takramLensFlare,
  temporalAntialias as takramTemporalAntialias,
} from "@takram/three-geospatial/webgpu";
import type { Camera } from "three";
import type { Node, TextureNode } from "three/webgpu";

import type { Disposable } from "../use-disposable";

export const dithering = takramDithering as unknown as Node<"vec3">;

export const lensFlare = takramLensFlare as unknown as (
  input: Node
) => Node<"vec4"> & Disposable;

export const temporalAntialias = takramTemporalAntialias as unknown as (
  input: Node,
  depth: TextureNode,
  velocity: TextureNode,
  camera: Camera
) => Node<"vec4"> & Disposable;
