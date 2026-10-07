import { notImplemented } from "@/lib/not-implemented";

export type EnsureAacEncoder = () => Promise<void>;

// TODO(M3): cache a promise of
// import("@mediabunny/aac-encoder").then(({ registerAacEncoder }) => registerAacEncoder()).
// Also check that Turbopack resolves its `worker_threads` browser stub.
export const ensureAacEncoder: EnsureAacEncoder = () =>
  notImplemented("export/ensureAacEncoder");
