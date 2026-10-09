import type { ClipModule, PlaygroundModule } from "./define";
import type { ProjectId } from "./manifest";

type Loader<T> = () => Promise<{ default: T }>;

export interface ProjectLoaders {
  clip: Loader<ClipModule>;
  playground: Loader<PlaygroundModule>;
}

export const projectLoaders: Record<ProjectId, ProjectLoaders> = {
  "example-turntable": {
    clip: () => import("./example-turntable/clip"),
    playground: () => import("./example-turntable/playground"),
  },
  showroom: {
    clip: () => import("./showroom/clip"),
    playground: () => import("./showroom/playground"),
  },
  underwater: {
    clip: () => import("./underwater/clip"),
    playground: () => import("./underwater/playground"),
  },
};
