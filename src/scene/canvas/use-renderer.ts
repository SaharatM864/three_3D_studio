import { useThree } from "@react-three/fiber";
import type { WebGPURenderer } from "three/webgpu";

export function useWebGPURenderer(): WebGPURenderer {
  return useThree((state) => state.gl) as unknown as WebGPURenderer;
}
