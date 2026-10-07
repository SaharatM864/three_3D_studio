import type { ClipModule, PlaygroundModule } from "./define";
import type { ProjectId } from "./manifest";

type Loader<T> = () => Promise<{ default: T }>;

export interface ProjectLoaders {
  clip: Loader<ClipModule>;
  playground: Loader<PlaygroundModule>;
}

/**
 * Lazy project code, client-side only. Typed by ProjectId so a missing entry
 * fails typecheck. Clip and playground load separately so each page only
 * pulls in its own code.
 */
export const projectLoaders: Record<ProjectId, ProjectLoaders> = {
  "example-turntable": {
    clip: () => import("./example-turntable/clip"),
    playground: () => import("./example-turntable/playground"),
  },
  showroom: {
    clip: () => import("./showroom/clip"),
    playground: () => import("./showroom/playground"),
  },
};
