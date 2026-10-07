<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project guide

3D Clip Studio renders 3D clips with React Three Fiber and exports MP4 (H.264 + AAC via Mediabunny/WebCodecs) entirely in the browser. It also has a game-style playground (`/play`) for inspecting lighting and materials. No render server.

- Architecture, module boundaries and roadmap: `docs/architecture.md` (Thai).
- Creating or editing a clip: follow `docs/clip-authoring.md`. Clips live in `src/clips/<id>/` and are registered in `src/clips/manifest.ts` + `src/clips/loaders.ts`.
- Scaffolded code calls `notImplemented()` and carries `TODO(<milestone>)` (M1–M6, G1–G2). Find work with `grep -rn "TODO(M1)" src`.

Rules:

- R3F, three.js, Rapier, Web Audio and Mediabunny code is client-only. Pages in `src/app/` reach it only through the `*-loader.tsx` files in `src/features/` (`'use client'` + `next/dynamic` with `ssr: false`).
- `src/project`, `src/timeline` and `src/presets` stay pure TypeScript (no React/three/mediabunny). Scene state at a frame comes only from `evaluateProject(project, frame)`. No `Math.random`, `Date.now` or `useFrame` delta as a clock.
- Import Mediabunny only via `@/export/mediabunny`, and load the AAC encoder only via `ensureAacEncoder()`.
- Anything that must appear in the exported video has to be drawn into the canvas. DOM/CSS/Drei `<Html>` is not recorded.
- Use `bun`. Run `bun run check` (lint + typecheck) before finishing. New routes need `bun run build` or `next dev` once to generate `PageProps` types.
- Respect the version pins listed in `README.md` (three 0.186.x, R3F 9, TypeScript 5, mediabunny = aac-encoder version).
