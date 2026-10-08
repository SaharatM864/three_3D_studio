import { MeshStandardMaterial } from "three";

import {
  materialParameters,
  type CreateMaterial,
} from "../materials/material-parameters";

export const createWebGLMaterial: CreateMaterial = (spec, values) =>
  new MeshStandardMaterial(materialParameters(spec, values));
