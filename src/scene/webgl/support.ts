import { RenderBackendUnavailableError } from "../backend/render-backend";

export class WebGLUnavailableError extends RenderBackendUnavailableError {
  constructor(options?: ErrorOptions) {
    super("WebGL 2 is unavailable", options);
    this.name = "WebGLUnavailableError";
  }
}

let support: Promise<boolean> | undefined;

export function detectWebGL2(): Promise<boolean> {
  support ??= Promise.resolve(hasWebGL2());
  return support;
}

function hasWebGL2(): boolean {
  const context = document.createElement("canvas").getContext("webgl2");
  if (context === null) return false;
  context.getExtension("WEBGL_lose_context")?.loseContext();
  return true;
}
