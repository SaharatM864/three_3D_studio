import { RenderBackendUnavailableError } from "../backend/render-backend";

export class WebGPUUnavailableError extends RenderBackendUnavailableError {
  constructor(options?: ErrorOptions) {
    super(
      "WebGPU is unavailable; the WebGL 2 fallback is not supported",
      options
    );
    this.name = "WebGPUUnavailableError";
  }
}

interface GPUNavigator {
  gpu?: { requestAdapter(): Promise<unknown> };
}

let support: Promise<boolean> | undefined;

export function detectWebGPU(): Promise<boolean> {
  support ??= requestAdapter();
  return support;
}

async function requestAdapter(): Promise<boolean> {
  const { gpu } = navigator as Navigator & GPUNavigator;
  if (!gpu) return false;
  try {
    return (await gpu.requestAdapter()) != null;
  } catch {
    return false;
  }
}
