import { cameraViewMatrix, positionWorld, vec4 } from "three/tsl";
import type { Node } from "three/webgpu";

import { highpVelocity } from "../../pipeline/takram";

export function surfaceVelocity(previousView: Node<"mat4">): Node<"vec3"> {
  const position = vec4(positionWorld, 1);
  const current = highpVelocity.currentProjectionMatrix
    .mul(cameraViewMatrix)
    .mul(position)
    .toVertexStage();
  const previous = highpVelocity.previousProjectionMatrix
    .mul(previousView)
    .mul(position)
    .toVertexStage();
  return current.xyz.div(current.w).sub(previous.xyz.div(previous.w));
}
