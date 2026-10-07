<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project guide

3D Clip Studio renders 3D clips with React Three Fiber and exports MP4 (H.264 + AAC via Mediabunny/WebCodecs) entirely in the browser. Work is split into projects: each one has a scene shared by a game-style playground (`/projects/<id>/play`) for inspecting it and a studio (`/projects/<id>/studio`) for its clip. No render server.

- Architecture, module boundaries and roadmap: `docs/architecture.md` (Thai).
- Creating or editing a project (scene, playground or clip): follow `docs/project-authoring.md`. Projects live in `src/projects/<id>/` (`scene.tsx`, `playground.tsx`, `clip.tsx`) and are registered in `src/projects/manifest.ts` + `src/projects/loaders.ts`. A project never imports another project.
- Scaffolded code calls `notImplemented()` and carries `TODO(<milestone>)` (M1–M6, G1–G2). Find work with `grep -rn "TODO(M1)" src`.

Rules:

- R3F, three.js, Rapier, Web Audio and Mediabunny code is client-only. Pages in `src/app/` reach it only through the `*-loader.tsx` files in `src/features/` (`'use client'` + `next/dynamic` with `ssr: false`).
- `src/model`, `src/timeline` and `src/presets` stay pure TypeScript (no React/three/mediabunny). Scene state at a frame comes only from `evaluateClip(clip, frame)` (playground: `evaluateScene`). No `Math.random`, `Date.now` or `useFrame` delta as a clock.
- Import Mediabunny only via `@/export/mediabunny`, and load the AAC encoder only via `ensureAacEncoder()`.
- Anything that must appear in the exported video has to be drawn into the canvas. DOM/CSS/Drei `<Html>` is not recorded.
- Use `bun`. Run `bun run check` (lint + typecheck) before finishing. New routes need `bun run build` or `next dev` once to generate `PageProps` types.
- Respect the version pins listed in `README.md` (three 0.186.x, R3F 9, TypeScript 5, mediabunny = aac-encoder version).
