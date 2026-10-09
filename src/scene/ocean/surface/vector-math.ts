import { Color } from "three";
import { exp, vec3 } from "three/tsl";
import type { Node } from "three/webgpu";

export function colorVec3(hex: number): Node<"vec3"> {
  const { r, g, b } = new Color(hex);
  return vec3(r, g, b);
}

export function expVec3(x: Node<"vec3">): Node<"vec3"> {
  return exp(x as unknown as Node<"float">) as unknown as Node<"vec3">;
}

export function mixVec3(
  a: Node<"vec3">,
  b: Node<"vec3">,
  t: Node<"vec3">
): Node<"vec3"> {
  return a.add(b.sub(a).mul(t));
}
