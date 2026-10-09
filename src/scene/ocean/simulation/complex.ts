import { vec2 } from "three/tsl";
import type { Node } from "three/webgpu";

export function complexMul(a: Node<"vec2">, b: Node<"vec2">): Node<"vec2"> {
  return vec2(a.x.mul(b.x).sub(a.y.mul(b.y)), a.x.mul(b.y).add(a.y.mul(b.x)));
}
