# Clip authoring guide

This guide is for AI coding agents (and humans) that add 3D clips to this repo. A clip is a TypeScript module the Studio previews at `/studio/<clip-id>` and exports to MP4 in the browser.

> **Status:** rendering and export are still scaffolded stubs (see the roadmap in `docs/architecture.md`). Until milestone M1 lands, a clip shows an empty canvas, but it must still typecheck and follow every rule below.

## What a clip is

Every `src/clips/<clip-id>/clip.tsx` default-exports `defineClip({ project, components? })`:

- `project: ClipProject` (`src/project/types.ts`) is plain, JSON-serializable data: video settings, environment, camera, lights, objects and audio.
- `components` (optional) holds R3F components for motion keyframes cannot express. Each one is referenced from an object with `kind: "custom"` and `componentKey`.

Working references:

- `src/clips/_template/clip.tsx`: start here. It includes a custom component example.
- `src/clips/example-turntable/clip.tsx`: a data-only clip.

## Add a clip

1. Pick a kebab-case id, e.g. `product-spin`.
2. Copy `src/clips/_template/` to `src/clips/product-spin/`.
3. In `clip.tsx`, set `project.id` to the id and edit the project.
4. Add `{ id, title, description }` to `clipManifest` in `src/clips/manifest.ts`.
5. Add `"product-spin": () => import("./product-spin/clip")` to `src/clips/loaders.ts`. Typecheck fails if the manifest and loaders disagree.
6. Put assets under `public/assets/{models,textures,hdri,audio,fonts}/` and reference them by path relative to `public/assets`, e.g. `"models/shoe.glb"`.
7. Run `bun run check`, then open `/studio/product-spin`.

## Project data in brief

- **Units:** meters for positions, radians for `rotation` (Euler XYZ), degrees for camera `fov`. Y is up.
- **Animation:** any `Animatable<T>` field is either a static value or `{ keyframes: [{ frame, value, easing? }] }`.
  - Keyframes are sorted by integer `frame`.
  - `easing` applies from that keyframe to the next one.
  - Easing names: `linear`, `step`, `easeIn/Out/InOut` + `Quad`/`Cubic`.
  - Values hold before the first keyframe and after the last one.
- **Video:** spread a format from `VIDEO_FORMATS` (`src/project/defaults.ts`) and set `durationInFrames`. Time is always `frame / fps`.
- **Presets** (`src/presets/`):
  - `lights: lightingPresets["studio-3-point"].lights`
  - `environment: { presetId: "studio-gray" }`
  - `material: { presetId: "brushed-metal", color: "#..." }`

  Fields you set override the preset.

- **Objects:** `kind` is one of `primitive` (`box`, `sphere`, `plane`, `cylinder`, `torus`), `model` (GLB `src`, optional `animation`), `text`, or `custom`.
- **Randomness:** `project.seed` feeds `createSeededRandom()` (`src/timeline/random.ts`).

## Rules

These keep preview and export identical. Breaking them produces clips that differ between runs or lose content in the MP4.

1. **Time comes from the frame only.**
   - Never use `Math.random()`, `Date.now()`, `performance.now()`, `useFrame`'s `delta`, or anything else that accumulates over time.
   - In custom components, read `useClipFrame().current` inside `useFrame()` and compute every value from `frame`/`timeSeconds`.
   - Use the seeded random for randomness.
2. **Only the canvas is recorded.** DOM elements, CSS, Drei `<Html>` and React UI never reach the MP4. Text must be 3D text or a canvas overlay.
3. **No React state per frame.** Do not `setState` on every frame. Mutate refs inside `useFrame`.
4. **Physics/particles:**
   - Use a fixed timestep.
   - The simulation must replay identically from frame 0. Prefer baking or closed-form motion.
5. **Assets:**
   - Same-origin only, under `public/assets/`. Prefer GLB/glTF.
   - Thai text needs a font file with Thai glyphs in `public/assets/fonts/`.
6. **Stay inside the clip folder.**
   - Only edit `src/clips/<id>/`, `manifest.ts`, `loaders.ts` and `public/assets/`.
   - Ask before changing engine code (`src/scene`, `src/timeline`, `src/export`, …) or adding dependencies.
   - Never import `mediabunny` directly.
7. **Data stays serializable.** `project` must contain only JSON values (no functions, class instances or three.js objects). Computed numbers like `Math.PI / 2` are fine.

## MVP limits

- 1920×1080 or 1080×1920 at 30 fps.
- 30–60 seconds. The first export target is 10 seconds.
- Solid opaque background (SDR).
- One mixed stereo audio track at 48 kHz.

## Checklist before finishing

- [ ] `project.id` equals the folder name, the manifest entry and the loader key
- [ ] `durationInFrames` matches the intended length (`seconds × fps`)
- [ ] Keyframe frames are within `0 … durationInFrames - 1` and sorted
- [ ] No wall-clock time, deltas or unseeded randomness anywhere in the clip
- [ ] Everything that must appear in the video is inside the canvas
- [ ] Assets exist under `public/assets/` and paths are relative to it
- [ ] `bun run check` passes
