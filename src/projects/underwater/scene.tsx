import type { SceneObjectSpec, Vec3 } from "@/model/types";
import { defineScene } from "@/projects/define";

const SEABED_Y = -12;

export const EYE_Y = -5;

export const SPAWN_Z = 10;

const SEABED_SIZE = 400;
const PILE_TOP = 4;
const BUOY_DISTANCES = [3, 10, 20] as const;
const BUOY_SIZE: Vec3 = [1.2, 1.2, 1.2];
const BUOY_SPACING = 1.6;

const ROCKS: readonly { id: string; position: Vec3; size: Vec3 }[] = [
  { id: "rock-a", position: [-6, SEABED_Y + 0.7, -3], size: [4, 2, 3] },
  { id: "rock-b", position: [5, SEABED_Y + 1, -8], size: [5, 3, 4] },
  { id: "rock-c", position: [-2, SEABED_Y + 0.5, 4], size: [2.4, 1.4, 2] },
  { id: "rock-d", position: [9, SEABED_Y + 0.6, 3], size: [3, 1.6, 2.6] },
  { id: "rock-e", position: [-11, SEABED_Y + 1.4, -12], size: [6, 4, 5] },
];

function buoys(): SceneObjectSpec[] {
  return BUOY_DISTANCES.flatMap((distance): SceneObjectSpec[] => {
    const z = SPAWN_Z - distance;
    return [
      {
        id: `buoy-red-${distance}`,
        kind: "primitive",
        shape: "sphere",
        size: BUOY_SIZE,
        transform: { position: [-BUOY_SPACING / 2, EYE_Y, z] },
        material: { presetId: "matte-plastic", color: "#e53935" },
        castShadow: true,
      },
      {
        id: `buoy-white-${distance}`,
        kind: "primitive",
        shape: "sphere",
        size: BUOY_SIZE,
        transform: { position: [BUOY_SPACING / 2, EYE_Y, z] },
        material: { presetId: "matte-plastic", color: "#f2f2f2" },
        castShadow: true,
      },
    ];
  });
}

export default defineScene({
  spec: {
    environment: {
      presetId: "noon",
      clouds: { coverage: 0.3 },
      ocean: { presetId: "calm" },
    },
    lights: [],
    objects: [
      {
        id: "seabed",
        kind: "primitive",
        shape: "plane",
        size: [SEABED_SIZE, SEABED_SIZE, 1],
        transform: {
          position: [0, SEABED_Y, 0],
          rotation: [-Math.PI / 2, 0, 0],
        },
        material: {
          presetId: "matte-plastic",
          color: "#c8b48a",
          roughness: 1,
        },
        receiveShadow: true,
      },
      ...ROCKS.map(({ id, position, size }): SceneObjectSpec => ({
        id,
        kind: "primitive",
        shape: "sphere",
        size,
        transform: { position },
        material: {
          presetId: "matte-plastic",
          color: "#5d5a55",
          roughness: 1,
        },
        castShadow: true,
        receiveShadow: true,
      })),
      {
        id: "pile",
        kind: "primitive",
        shape: "cylinder",
        size: [0.9, PILE_TOP - SEABED_Y, 0.9],
        transform: { position: [-4, (PILE_TOP + SEABED_Y) / 2, 2] },
        material: { presetId: "matte-plastic", color: "#8a7a63" },
        castShadow: true,
        receiveShadow: true,
      },
      ...buoys(),
    ],
  },
});
