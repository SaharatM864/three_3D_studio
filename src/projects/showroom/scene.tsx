import type { SceneObjectSpec } from "@/model/types";
import { defineScene } from "@/projects/define";
import { materialPresets, type MaterialPresetId } from "@/presets/materials";

export const PLINTH_SPACING = 2.5;

export const DECK_HEIGHT = 2;

const DECK_DRAFT = 4;
const DECK_WIDTH = 18;
const DECK_DEPTH = 10;

const materialIds = Object.keys(materialPresets) as MaterialPresetId[];

export const PLINTH_ROW_HALF_WIDTH =
  ((materialIds.length - 1) * PLINTH_SPACING) / 2;

function materialSwatches(): SceneObjectSpec[] {
  return materialIds.flatMap((id, index): SceneObjectSpec[] => {
    const x = index * PLINTH_SPACING - PLINTH_ROW_HALF_WIDTH;
    return [
      {
        id: `plinth-${id}`,
        kind: "primitive",
        shape: "box",
        size: [1, 1, 1],
        transform: { position: [x, DECK_HEIGHT + 0.5, 0] },
        material: { presetId: "matte-plastic" },
        castShadow: true,
        receiveShadow: true,
      },
      {
        id: `swatch-${id}`,
        kind: "primitive",
        shape: "sphere",
        size: [0.7, 0.7, 0.7],
        transform: { position: [x, DECK_HEIGHT + 1.35, 0] },
        material: { presetId: id },
        castShadow: true,
      },
    ];
  });
}

export default defineScene({
  spec: {
    environment: {
      presetId: "morning",
      clouds: { coverage: 0.4 },
      ocean: { presetId: "moderate" },
    },
    lights: [],
    objects: [
      {
        id: "deck",
        kind: "primitive",
        shape: "box",
        size: [DECK_WIDTH, DECK_HEIGHT + DECK_DRAFT, DECK_DEPTH],
        transform: { position: [0, (DECK_HEIGHT - DECK_DRAFT) / 2, 0] },
        material: { presetId: "matte-plastic" },
        receiveShadow: true,
      },
      ...materialSwatches(),
    ],
  },
});
