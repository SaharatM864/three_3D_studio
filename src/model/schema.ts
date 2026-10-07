import { notImplemented } from "@/lib/not-implemented";

import type { ClipSpec } from "./types";

export const CURRENT_SCHEMA_VERSION = 1 satisfies ClipSpec["schemaVersion"];

/** Parse untrusted JSON (imported files, in-app LLM output) into a clip. */
export type ValidateClip = (input: unknown) => ClipSpec;

// TODO(future): validate shape and migrate older schema versions.
export const validateClip: ValidateClip = () =>
  notImplemented("model/validateClip");
