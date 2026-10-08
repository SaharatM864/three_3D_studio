# Project authoring guide

This guide is for AI coding agents (and humans) that add or edit 3D projects in this repo.

A **project** is one folder, `src/projects/<project-id>/`, with three modules:

| File             | What it is                                                                               | Where it shows                           |
| ---------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------- |
| `scene.tsx`      | The world: environment, lights, objects and custom components                            | Both modes                               |
| `playground.tsx` | Walking around the scene: spawn point, colliders and playground-only objects             | `/projects/<id>/play`                    |
| `clip.tsx`       | The video: format, camera, keyframes, audio and clip-only objects (one clip per project) | `/projects/<id>/studio`, exported to MP4 |

Build the scene once, inspect it in the playground, then edit the video in the clip. The playground and the clip always show the same scene.

> **Status:** the playground renders the scene (sky, sun, primitives) with a temporary orbit camera. Walking (G1), the studio viewport and export (M1) are still stubs (see the roadmap in `docs/architecture.md`). A project must still typecheck and follow every rule below.

## Working references

- `src/projects/_template/`: start here. Its scene includes a custom component example.
- `src/projects/example-turntable/`: a data-only scene, plus a clip that animates a scene object with `animate`.
- `src/projects/showroom/`: a scene generated from `materialPresets`, plus a camera-only clip.

## Add a project

1. Pick a kebab-case id, e.g. `product-spin`.
2. Copy `src/projects/_template/` to `src/projects/product-spin/`.
3. In `clip.tsx`, set `id` to the project id and `title` to the clip title.
4. Add `{ id, title, description }` to `projectManifest` in `src/projects/manifest.ts`. Optionally add `thumbnail`, a path under `public/assets/` (e.g. `"projects/<id>/thumbnail.webp"`, 16:9), shown on the home page card.
5. Add an entry to `src/projects/loaders.ts`. Typecheck fails if the manifest and loaders disagree.

   ```ts
   "product-spin": {
     clip: () => import("./product-spin/clip"),
     playground: () => import("./product-spin/playground"),
   },
   ```

6. Put assets under `public/assets/` and reference them by path relative to it. Use `projects/product-spin/…` for assets only this project uses (e.g. `"projects/product-spin/models/shoe.glb"`). Shared assets go in `models/`, `textures/`, `hdri/`, `audio/` and `fonts/`.
7. Run `bun run check`, then open `/projects/product-spin/play` and `/projects/product-spin/studio`.

## The three modules

### `scene.tsx`

```ts
export default defineScene({
  spec: { environment, lights, objects },
  components: { "my-component": MyComponent }, // optional
});
```

- Keep scene values static. Put keyframes in `clip.tsx` so the playground shows a stable world.
- The clip and the playground both mount `components`, so they follow the clip time rules below.
- A scene may export named constants (e.g. layout numbers) for its own `clip.tsx` and `playground.tsx`.

### `clip.tsx`

```ts
import scene from "./scene";

export default defineClip(
  scene,
  {
    schemaVersion: 1,
    id,
    title,
    video,
    seed,
    camera,
    audio,
    environment, // optional: merged field by field over the scene's
    lights, // optional: replaces the scene's lights
    animate: { "<scene object id>": { transform, material } }, // optional
    extraObjects, // optional: objects that exist only in the video, e.g. titles
  },
  { components }
); // optional clip-only custom components
```

- `animate` adds keyframes to scene objects by id. Each `transform` field (`position`, `rotation`, `scale`) and each `material` field replaces the scene's value. An unknown id throws when the clip loads.
- Only `primitive` and `text` objects have a material to animate.
- Object ids must stay unique across the scene and `extraObjects`.

### `playground.tsx`

```ts
import scene from "./scene";

export default definePlayground(
  scene,
  {
    spawn: [0, 1, 6],
    colliders: { "<object id>": "cuboid" | "ball" | "trimesh" | "none" }, // optional
    extraObjects, // optional: walls, props, anything only for walking around
  },
  { components }
); // optional playground-only custom components
```

- Colliders default to a fixed `"cuboid"` for `primitive` and `model` objects and `"none"` for the rest.
- Nothing in the playground is recorded. Playground-only components may use real time (`useFrame` delta, input), but scene components may not.

## Scene data in brief

- **Units:** meters for positions, radians for `rotation` (Euler XYZ), degrees for camera `fov`. Y is up.
- **Animation:** any `Animatable<T>` field is either a static value or `{ keyframes: [{ frame, value, easing? }] }`.
  - Keyframes are sorted by integer `frame`.
  - `easing` applies from that keyframe to the next one.
  - Easing names: `linear`, `step`, `easeIn/Out/InOut` + `Quad`/`Cubic`.
  - Values hold before the first keyframe and after the last one.
- **Video:** spread a format from `VIDEO_FORMATS` (`src/model/defaults.ts`) and set `durationInFrames`. Time is always `frame / fps`.
- **Environment** (sky, sun and image-based light, rendered by `@takram/three-atmosphere`):
  - `environment: { presetId: "morning" }` picks a preset: `morning`, `noon` or `golden-hour`.
  - Override any field: `location: { latitude, longitude, height }` (degrees, meters; default Bangkok), `dateTime` (ISO-8601 with an explicit offset, e.g. `"2026-03-21T09:00:00+07:00"`) and `exposure` (about 3–10).
  - The scene is a local frame placed at `location`: +X points north, +Y up, +Z east. The sun position follows `dateTime`, so change the time to move the sun.
  - `clouds` (optional) adds volumetric clouds; `clouds: {}` uses the defaults (coverage 0.3, three layers). **Not rendered yet** (the renderer is M6), but the data is already validated.
    - `coverage` is 0–1. `layers` (at most 4) replaces the default set: `{ channel: "r" | "g" | "b" | "a", altitude, height, densityScale?, shadow?, … }`.
    - `altitude` and `height` are meters above the WGS84 ellipsoid, not above the scene ground at `location.height`.
    - `localWeather.velocity`, `shape.velocity` and `shapeDetail.velocity` are texture offsets per second, not wind speed (e.g. `localWeather: { velocity: [0.001, 0] }`).
    - Keep `scattering` and `haze` at their defaults unless the shot needs it. Defaults and limits are in `src/presets/clouds.ts`.
- **Lights:** the sun comes from the environment. `lights` are extra lights only; use `lights: []` unless the scene needs them (e.g. `lightingPresets["night-neon"].lights`).
- **Presets** (`src/presets/`): fields you set override the preset, e.g. `material: { presetId: "brushed-metal", color: "#..." }`.
- **Objects:** `kind` is one of `primitive` (`box`, `sphere`, `plane`, `cylinder`, `torus`), `model` (GLB `src`, optional `animation`), `text`, or `custom`.
- **Randomness:** `seed` feeds `createSeededRandom()` (`src/timeline/random.ts`).

## Rules

These keep preview and export identical. Breaking them produces clips that differ between runs or lose content in the MP4.

1. **Time comes from the frame only** (`scene.tsx` and `clip.tsx`).
   - Never use `Math.random()`, `Date.now()`, `performance.now()`, `useFrame`'s `delta`, or anything else that accumulates over time.
   - In custom components, read `useClipFrame().current` inside `useFrame()` and compute every value from `frame`/`timeSeconds`.
   - Use the seeded random for randomness.
2. **Only the canvas is recorded.** DOM elements, CSS, Drei `<Html>` and React UI never reach the MP4. Text must be 3D text or a canvas overlay.
3. **No React state per frame.** Do not `setState` on every frame. Mutate refs inside `useFrame`.
4. **Physics/particles in the clip:**
   - Use a fixed timestep.
   - The simulation must replay identically from frame 0. Prefer baking or closed-form motion.
5. **Assets:**
   - Same-origin only, under `public/assets/`. Prefer GLB/glTF.
   - Thai text needs a font file with Thai glyphs, e.g. in `public/assets/fonts/`.
6. **Stay inside the project folder.**
   - Only edit `src/projects/<id>/`, `manifest.ts`, `loaders.ts` and `public/assets/`.
   - Never import another project. Use `./` imports inside your own project; ESLint rejects `@/projects/<other-id>/…`.
   - Ask before changing engine code (`src/scene`, `src/timeline`, `src/model`, `src/export`, …) or adding dependencies.
   - Never import `mediabunny` directly.
7. **Data stays serializable.** `spec` and the clip/playground definitions must contain only JSON values (no functions, class instances or three.js objects). Computed numbers like `Math.PI / 2` and data built with `map` are fine.

## MVP limits

- 1920×1080 or 1080×1920 at 30 fps. A project has one clip, so for both orientations make a second project with a copy of the scene.
- 30–60 seconds. The first export target is 10 seconds.
- Opaque sky background from the environment (SDR). No transparent background.
- One mixed stereo audio track at 48 kHz.

## Checklist before finishing

- [ ] Folder name, manifest entry, loader key and the clip's `id` are all the project id
- [ ] `durationInFrames` matches the intended length (`seconds × fps`)
- [ ] Keyframe frames are within `0 … durationInFrames - 1` and sorted
- [ ] Every `animate` key is a scene object id, and object ids are unique
- [ ] No wall-clock time, deltas or unseeded randomness in `scene.tsx` or `clip.tsx`
- [ ] `environment.dateTime`, if set, has an explicit UTC offset
- [ ] Everything that must appear in the video is inside the canvas
- [ ] Assets exist under `public/assets/` and paths are relative to it
- [ ] No imports from other projects
- [ ] `bun run check` passes
