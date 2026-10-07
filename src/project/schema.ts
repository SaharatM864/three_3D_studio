import { notImplemented } from "@/lib/not-implemented";

import type { ClipProject } from "./types";

export const CURRENT_SCHEMA_VERSION = 1 satisfies ClipProject["schemaVersion"];

/** Parse untrusted JSON (imported files, in-app LLM output) into a project. */
export type ValidateProject = (input: unknown) => ClipProject;

// TODO(future): validate shape and migrate older schema versions.
export const validateProject: ValidateProject = () =>
  notImplemented("project/validateProject");
