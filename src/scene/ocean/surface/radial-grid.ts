import { BufferAttribute, BufferGeometry, Sphere, Vector3 } from "three";

import type { OceanGridSettings } from "../../render-config";

export interface RadialGrid {
  geometry: BufferGeometry;
  innerSpacing: number;
}

function radialGridRadii({
  rings,
  spacing,
  soften,
}: OceanGridSettings): Float64Array {
  const radii = new Float64Array(rings + 1);
  for (let ring = 1; ring <= rings; ring++) {
    const growth = 1 + (ring - 1) / soften;
    radii[ring] = radii[ring - 1] + spacing * growth * growth;
  }
  return radii;
}

export function createRadialGrid(settings: OceanGridSettings): RadialGrid {
  const { rings, sectors, spacing } = settings;
  const radii = radialGridRadii(settings);

  const positions = new Float32Array((rings * sectors + 1) * 3);
  const step = (Math.PI * 2) / sectors;
  for (let ring = 1; ring <= rings; ring++) {
    const radius = radii[ring];
    const offset = (ring % 2) * 0.5 * step;
    let cursor = (1 + (ring - 1) * sectors) * 3;
    for (let sector = 0; sector < sectors; sector++, cursor += 3) {
      positions[cursor] = radius * Math.cos(sector * step + offset);
      positions[cursor + 1] = radius * Math.sin(sector * step + offset);
    }
  }

  const indices = new Uint32Array(sectors * 3 + (rings - 1) * sectors * 6);
  let cursor = 0;
  for (let sector = 0; sector < sectors; sector++) {
    const next = (sector + 1) % sectors;
    indices[cursor++] = 0;
    indices[cursor++] = 1 + sector;
    indices[cursor++] = 1 + next;
  }
  for (let ring = 1; ring < rings; ring++) {
    const inner = 1 + (ring - 1) * sectors;
    const outer = 1 + ring * sectors;
    const outwardShift = ring % 2 === 0;
    for (let sector = 0; sector < sectors; sector++) {
      const next = (sector + 1) % sectors;
      if (outwardShift) {
        indices[cursor++] = inner + sector;
        indices[cursor++] = outer + sector;
        indices[cursor++] = inner + next;
        indices[cursor++] = inner + next;
        indices[cursor++] = outer + sector;
        indices[cursor++] = outer + next;
      } else {
        indices[cursor++] = inner + sector;
        indices[cursor++] = outer + next;
        indices[cursor++] = outer + sector;
        indices[cursor++] = inner + sector;
        indices[cursor++] = inner + next;
        indices[cursor++] = outer + next;
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setIndex(new BufferAttribute(indices, 1));
  geometry.boundingSphere = new Sphere(new Vector3(), radii[rings]);

  return { geometry, innerSpacing: spacing };
}
