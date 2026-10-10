import type { Vec3 } from "@/model/types";
import { defineScene } from "@/projects/define";

export const VIEW_POSITION: Vec3 = [16, 4, 16];

const RUNABOUT_SIZE: Vec3 = [2.1, 1.45, 6.5];
const YACHT_SIZE: Vec3 = [3.35, 2.35, 10.7];
const LOOP_RADIUS = 30;

export default defineScene({
  spec: {
    environment: {
      presetId: "noon",
      ocean: { presetId: "moderate" },
    },
    lights: [],
    objects: [
      {
        id: "runabout",
        kind: "primitive",
        shape: "box",
        size: RUNABOUT_SIZE,
        transform: { position: [LOOP_RADIUS, 0.5, 0] },
        material: { presetId: "glossy-paint", color: "#f4f4f4" },
        castShadow: true,
        buoyancy: { presetId: "runabout", throttle: 0.35, steer: 0.4 },
      },
      {
        id: "motor-yacht",
        kind: "primitive",
        shape: "box",
        size: YACHT_SIZE,
        transform: { position: [-8, 0.75, -10], rotation: [0, 0.6, 0] },
        material: { presetId: "glossy-paint", color: "#1f3a5f" },
        castShadow: true,
        buoyancy: { presetId: "motor-yacht" },
      },
      {
        id: "buoy",
        kind: "primitive",
        shape: "sphere",
        size: [1.2, 1.2, 1.2],
        transform: { position: [6, 0, 4] },
        material: { presetId: "matte-plastic", color: "#e53935" },
        castShadow: true,
        buoyancy: { presetId: "buoy" },
      },
      {
        id: "spar-buoy",
        kind: "primitive",
        shape: "cylinder",
        size: [0.6, 3, 0.6],
        transform: { position: [9, 0.5, -2] },
        material: { presetId: "matte-plastic", color: "#fdd835" },
        castShadow: true,
        buoyancy: {
          presetId: "buoy",
          density: 300,
          centerOfMass: [0, -0.42, 0],
        },
      },
      {
        id: "crate-light",
        kind: "primitive",
        shape: "box",
        transform: { position: [3, 0.4, 8] },
        material: { presetId: "matte-plastic", color: "#c8a165" },
        castShadow: true,
        buoyancy: { presetId: "crate", density: 150 },
      },
      {
        id: "crate",
        kind: "primitive",
        shape: "box",
        transform: { position: [5, 0, 10] },
        material: { presetId: "matte-plastic", color: "#a47a45" },
        castShadow: true,
        buoyancy: { presetId: "crate" },
      },
      {
        id: "crate-heavy",
        kind: "primitive",
        shape: "box",
        size: [1.2, 0.8, 1.6],
        transform: { position: [8, -0.2, 7] },
        material: { presetId: "matte-plastic", color: "#6d4c2f" },
        castShadow: true,
        buoyancy: { presetId: "crate", density: 850 },
      },
    ],
  },
});
