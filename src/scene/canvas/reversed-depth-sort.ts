import type { WebGPURenderer } from "three/webgpu";

type RenderSort = NonNullable<Parameters<WebGPURenderer["setOpaqueSort"]>[0]>;
type RenderItem = Parameters<RenderSort>[0];

function compareOrder(a: RenderItem, b: RenderItem): number {
  return (
    (a.groupOrder ?? 0) - (b.groupOrder ?? 0) ||
    (a.renderOrder ?? 0) - (b.renderOrder ?? 0)
  );
}

function frontToBack(a: RenderItem, b: RenderItem): number {
  return (
    compareOrder(a, b) || (b.z ?? 0) - (a.z ?? 0) || (a.id ?? 0) - (b.id ?? 0)
  );
}

function backToFront(a: RenderItem, b: RenderItem): number {
  return (
    compareOrder(a, b) || (a.z ?? 0) - (b.z ?? 0) || (a.id ?? 0) - (b.id ?? 0)
  );
}

export function applyReversedDepthSort(renderer: WebGPURenderer): void {
  renderer.setOpaqueSort(frontToBack);
  renderer.setTransparentSort(backToFront);
}
