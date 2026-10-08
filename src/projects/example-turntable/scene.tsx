import { defineScene } from "@/projects/define";

export default defineScene({
  spec: {
    environment: { presetId: "morning" },
    lights: [],
    objects: [
      {
        id: "floor",
        kind: "primitive",
        shape: "plane",
        size: [20, 20, 1],
        transform: { rotation: [-Math.PI / 2, 0, 0] },
        material: { presetId: "matte-plastic" },
        receiveShadow: true,
      },
      {
        id: "hero",
        kind: "primitive",
        shape: "box",
        transform: { position: [0, 0.5, 0] },
        material: { presetId: "glossy-paint" },
        castShadow: true,
      },
    ],
  },
});
