import { MeshStandardNodeMaterial } from "three/webgpu";

import { materialParameters, type CreateMaterial } from "./material-parameters";

export const createMaterial: CreateMaterial = (spec, values) =>
  new MeshStandardNodeMaterial(materialParameters(spec, values));
