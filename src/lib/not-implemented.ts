export function notImplemented(name: string): never {
  throw new Error(`Not implemented: ${name}`);
}
