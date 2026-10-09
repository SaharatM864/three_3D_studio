export function hasQueryFlag(name: string): boolean {
  return new URLSearchParams(window.location.search).has(name);
}
