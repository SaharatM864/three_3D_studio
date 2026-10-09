import { vec4 } from "three/tsl";
import type { Node, TextureNode } from "three/webgpu";

import type { Disposable } from "../use-disposable";
import type { NightSky } from "./night";
import { aerialPerspective, StarsNode } from "./takram";

const STARS_URL = "/assets/atmosphere/stars.bin";

export interface AerialPerspectiveHandle extends Disposable {
  readonly node: Node<"vec4">;
  setNightSky(sky: NightSky): boolean;
}

export function createAerialPerspective(
  color: Node<"vec4">,
  depth: TextureNode,
  shadowLength: Node<"vec2"> | null
): AerialPerspectiveHandle {
  const node = aerialPerspective(color, depth, null, shadowLength);
  const { skyNode } = node;
  skyNode.starsNode.dispose();
  skyNode.starsNode = new StarsNode(STARS_URL);
  skyNode.starsNode.intensity.value = 0;
  skyNode.showStars = false;

  return {
    node: vec4(node.rgb, 1),

    setNightSky({ active, starsIntensity }) {
      skyNode.starsNode.intensity.value = starsIntensity;
      if (skyNode.showStars === active) return false;
      skyNode.showStars = active;
      skyNode.moonScattering = active;
      node.moonScattering = active;
      return true;
    },

    dispose() {
      node.dispose();
      skyNode.starsNode.dispose();
    },
  };
}
