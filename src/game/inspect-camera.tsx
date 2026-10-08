import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";

import type { Vec3 } from "@/model/types";

// TODO(G1): replace with <PlayerController/> (pointer lock, WASD, physics).
export function InspectCamera({ spawn }: { spawn: Vec3 }) {
  const camera = useThree((state) => state.camera);
  const [x, y, z] = spawn;

  useLayoutEffect(() => {
    camera.position.set(x, y, z);
  }, [camera, x, y, z]);

  return <OrbitControls makeDefault target={[0, y, 0]} />;
}
