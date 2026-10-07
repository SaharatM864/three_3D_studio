import type { ClipModule } from "./define-clip";
import type { ClipId } from "./manifest";

type ClipLoader = () => Promise<{ default: ClipModule }>;

/** Lazy clip code, client-side only. Typed by ClipId so a missing entry fails typecheck. */
export const clipLoaders: Record<ClipId, ClipLoader> = {
  "example-turntable": () => import("./example-turntable/clip"),
};
