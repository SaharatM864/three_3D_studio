import { notImplemented } from "@/lib/not-implemented";

import type { BufferTarget, StreamTarget } from "./mediabunny";

export type OutputTargetChoice =
  | {
      kind: "file-stream";
      target: StreamTarget;
      /** Close the FileSystemWritableFileStream after finalize. */
      close(): Promise<void>;
    }
  | { kind: "memory"; target: BufferTarget };

/**
 * Must be called directly from the Export button's click handler, before any
 * long await, because showSaveFilePicker() needs a user gesture. Resolves null
 * when the user cancels the picker.
 */
export type PickOutputTarget = (
  suggestedName: string
) => Promise<OutputTargetChoice | null>;

// TODO(M1): showSaveFilePicker → createWritable → StreamTarget (respecting chunk
// positions); BufferTarget when the API is missing. TODO(M5): size limits for memory.
export const pickOutputTarget: PickOutputTarget = () =>
  notImplemented("export/pickOutputTarget");
