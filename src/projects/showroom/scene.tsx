import type { SceneObjectSpec } from "@/model/types";
import { defineScene } from "@/projects/define";
import { lightingPresets } from "@/presets/lighting";
import { materialPresets, type MaterialPresetId } from "@/presets/materials";

/** Distance between plinths along the x axis, in meters. */
export const PLINTH_SPACING = 2.5;

const materialIds = Object.keys(materialPresets) as MaterialPresetId[];

/** x of the first and last plinth, so the clip camera can travel past them. */
export const PLINTH_ROW_HALF_WIDTH =
  ((materialIds.length - 1) * PLINTH_SPACING) / 2;

/** One plinth with a sphere on top per material preset, in a row along x. */
function materialSwatches(): SceneObjectSpec[] {
  return materialIds.flatMap((id, index): SceneObjectSpec[] => {
    const x = index * PLINTH_SPACING - PLINTH_ROW_HALF_WIDTH;
    return [
      {
        id: `plinth-${id}`,
        kind: "primitive",
        shape: "box",
        size: [1, 1, 1],
        transform: { position: [x, 0.5, 0] },
        material: { presetId: "matte-plastic" },
        castShadow: true,
        receiveShadow: true,
      },
      {
        id: `swatch-${id}`,
        kind: "primitive",
        shape: "sphere",
        size: [0.7, 0.7, 0.7],
        transform: { position: [x, 1.35, 0] },
        material: { presetId: id },
        castShadow: true,
      },
    ];
  });
}

export default defineScene({
  spec: {
    environment: { presetId: "studio-gray" },
    lights: lightingPresets["studio-3-point"].lights,
    objects: [
      {
        id: "floor",
        kind: "primitive",
        shape: "plane",
        size: [40, 40, 1],
        transform: { rotation: [-Math.PI / 2, 0, 0] },
        material: { presetId: "matte-plastic" },
        receiveShadow: true,
      },
      ...materialSwatches(),
    ],
  },
});
