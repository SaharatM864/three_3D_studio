import { useEffect, useState } from "react";

export type WebGPUSupport = "checking" | "supported" | "unsupported";

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

export function useWebGPUSupport(): WebGPUSupport {
  const [state, setState] = useState<WebGPUSupport>("checking");

  useEffect(() => {
    let active = true;
    void detectWebGPU().then((supported) => {
      if (active) setState(supported ? "supported" : "unsupported");
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
