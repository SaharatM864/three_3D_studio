import { notImplemented } from "@/lib/not-implemented";

/**
 * Register the WASM AAC encoder for browsers without a usable native one
 * (e.g. Firefox, desktop Linux). Loaded lazily; safe to call repeatedly.
 */
export type EnsureAacEncoder = () => Promise<void>;

// TODO(M3): cache a promise of
// import("@mediabunny/aac-encoder").then(({ registerAacEncoder }) => registerAacEncoder()).
// Also check that Turbopack resolves its `worker_threads` browser stub.
export const ensureAacEncoder: EnsureAacEncoder = () =>
  notImplemented("export/ensureAacEncoder");
