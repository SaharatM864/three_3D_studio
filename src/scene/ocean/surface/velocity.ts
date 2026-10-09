import { cameraViewMatrix, positionWorld, vec4 } from "three/tsl";
import type { Node } from "three/webgpu";

import type { SurfaceUniforms } from "./uniforms";

export function surfaceVelocity({
  projection,
  previousProjection,
  previousView,
}: SurfaceUniforms): Node<"vec3"> {
  const position = vec4(positionWorld, 1);
  const current = projection
    .mul(cameraViewMatrix)
    .mul(position)
    .toVertexStage();
  const previous = previousProjection
    .mul(previousView)
    .mul(position)
    .toVertexStage();
  return current.xyz.div(current.w).sub(previous.xyz.div(previous.w));
}
