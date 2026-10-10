import { Vector3 } from "three";

export interface Wrench {
  readonly force: Vector3;
  readonly torque: Vector3;
}

export function createWrench(): Wrench {
  return { force: new Vector3(), torque: new Vector3() };
}

export function clearWrench(wrench: Wrench): void {
  wrench.force.set(0, 0, 0);
  wrench.torque.set(0, 0, 0);
}

export function addForce(
  wrench: Wrench,
  fx: number,
  fy: number,
  fz: number,
  rx: number,
  ry: number,
  rz: number
): void {
  wrench.force.x += fx;
  wrench.force.y += fy;
  wrench.force.z += fz;
  wrench.torque.x += ry * fz - rz * fy;
  wrench.torque.y += rz * fx - rx * fz;
  wrench.torque.z += rx * fy - ry * fx;
}
