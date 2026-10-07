# 3D Clip Studio

WebApp สำหรับทำคลิป 3D, เล่นเกม 3D และ export เป็น `.mp4` ได้บนเบราว์เซอร์ การ render, encode และรวมไฟล์ทำบนเครื่องผู้ใช้ทั้งหมด ไม่มี render server

งานแบ่งเป็น **project** (`src/projects/<id>/`) แต่ละ project มีฉากเดียว (`scene.tsx`) ที่ใช้ร่วมกันใน 2 หน้า

- `/projects/<id>/play`: Playground สำหรับเดินดูฉาก (`playground.tsx`)
- `/projects/<id>/studio`: Studio สำหรับตัดต่อและ export คลิป (`clip.tsx`)

สถานะ: **Phase 1** วางโครงสร้างโฟลเดอร์ type contracts และ stub แล้ว แต่ส่วน render และ export ยังไม่ได้ implement (ดู roadmap ใน [`docs/architecture.md`](docs/architecture.md))

## Tech stack

| ชั้น          | Package                                          | ใช้ทำอะไร                                                                                                |
| ------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Framework     | `next` 16 (App Router + Turbopack)               | ตัวแอป, routing และ build สำหรับ deploy บน Vercel (ใช้แทน React + Vite ในเอกสารต้นทาง)                   |
| UI            | `react` / `react-dom` 19                         | สร้าง UI ของ editor, preview controls และหน้าเกม                                                         |
| ภาษา          | TypeScript 5.9                                   | กำหนด type ของ project, scene, timeline และ export config                                                |
| Styling       | Tailwind CSS 4 (`@tailwindcss/postcss`)          | จัดหน้าตา UI                                                                                             |
| UI components | shadcn/ui (Base UI, style `base-nova`)           | component สำเร็จรูปใน `src/components/ui` ใช้ `cn` จาก package `cn` และไอคอน `lucide-react`              |
| 3D engine     | `three`                                          | render โมเดล, วัสดุ, แสง, กล้อง และ shader ผ่าน WebGL2                                                   |
| React กับ 3D  | `@react-three/fiber` 9                           | เขียนฉาก three.js เป็น React components และคุม render loop (`frameloop`, `advance()`)                    |
| 3D helpers    | `@react-three/drei`                              | helper สำเร็จรูป เช่น โหลด GLB/glTF, กล้อง, `KeyboardControls` สำหรับรับปุ่มในเกม                        |
| Physics (เกม) | `@react-three/rapier`                            | ระบบฟิสิกส์ชน/ตก/แรง ใช้ fixed timestep และ step เองได้ เพื่อให้ export ซ้ำได้ผลเหมือนเดิม               |
| State         | `zustand`                                        | เก็บ state ของเกมและ editor                                                                              |
| Export วิดีโอ | `mediabunny`                                     | encode H.264 และ AAC ผ่าน WebCodecs แล้วรวมเป็นไฟล์ MP4 (`CanvasSource`, `StreamTarget`, `BufferTarget`) |
| AAC fallback  | `@mediabunny/aac-encoder`                        | AAC encoder แบบ WASM สำหรับเบราว์เซอร์ที่ไม่มี AAC ในตัว ใช้ dynamic import เฉพาะตอนจำเป็น               |
| Types         | `@types/three`, `@types/wicg-file-system-access` | type ของ three.js และ `showSaveFilePicker()` ที่ TypeScript ยังไม่มีในตัว                                |
| Tooling       | ESLint, Prettier (+ tailwind plugin)             | ตรวจโค้ดและจัดรูปแบบ                                                                                     |

### Browser API ที่ใช้ (ไม่ต้องติดตั้ง)

- **WebCodecs**: encoder ของวิดีโอและเสียงในเบราว์เซอร์ ซึ่ง Mediabunny เรียกใช้ให้
- **Web Audio API / OfflineAudioContext**: เล่นเสียงตอน preview และเกม และ mix เสียงตาม timeline ตอน export
- **File System Access API**: เขียนไฟล์ MP4 ลงเครื่องโดยตรงแบบ stream ไม่ต้องเก็บทั้งไฟล์ไว้ใน RAM

### ส่วนที่จะเพิ่มเมื่อจำเป็น (ยังไม่ติดตั้ง)

- `@react-three/postprocessing` + `postprocessing`: ใช้ทำ effect เช่น bloom หรือ DOF
- `ecctrl`: character controller สำเร็จรูป
- IndexedDB: autosave
- Web Worker / OffscreenCanvas: เพิ่มเมื่อ profiling เจอว่า main thread เป็นคอขวด

ส่วนนี้ตั้งใจไม่ใช้: ffmpeg.wasm, `mp4-muxer` (deprecated), Remotion, MediaRecorder เป็น exporter หลัก

## โครงสร้างโฟลเดอร์

```text
src/
├── app/           routing เท่านั้น: /, /projects/[projectId]/studio, /projects/[projectId]/play
├── features/      UI ของ studio และ playground (*-loader.tsx เป็น client boundary)
├── projects/      project ที่ AI เขียน (<id>/scene.tsx, playground.tsx, clip.tsx) + define.ts, manifest.ts, loaders.ts (_template สำหรับคัดลอก)
├── model/         type ของ scene/clip/playground และ composeClip (pure TS)
├── timeline/      evaluateClip(clip, frame), evaluateScene, easing, interpolation, seeded random (pure TS)
├── presets/       preset แสง วัสดุ และสภาพแวดล้อมที่ใช้ร่วมกัน (pure data)
├── scene/         ชั้น render ด้วย R3F: canvas, scene content, render bridge, frame driver, camera/lights/objects
├── game/          playground: controls, physics, player, playground scene
├── audio/         โหลดเสียง, เล่นตอน preview, offline mix
├── export/        capability check, AAC fallback, output target, export loop
├── compositing/   overlay 2D ที่ต้องติดไปในวิดีโอ
├── stores/        zustand store สำหรับ state ของ UI
├── components/    shadcn ui + placeholder
└── lib/           utils, notImplemented
public/assets/     ใช้ร่วมกัน: models, textures, hdri, audio, fonts · เฉพาะ project: projects/<id>/
docs/              architecture.md, project-authoring.md
```

- หน้าที่และข้อจำกัดของแต่ละโมดูลอยู่ใน [`docs/architecture.md`](docs/architecture.md)
- วิธีเพิ่มหรือแก้ project อยู่ใน [`docs/project-authoring.md`](docs/project-authoring.md)
- ฟังก์ชันที่ยังไม่ทำมี `TODO(<milestone>)` กำกับ ค้นได้ด้วย `grep -rn "TODO(M1)" src`

## คำสั่ง

```bash
bun install          # ติดตั้ง dependencies
bun dev              # dev server ที่ http://localhost:3000
bun run build        # production build
bun run check        # lint + typecheck
bun run lint:fix     # แก้ปัญหา lint ที่แก้อัตโนมัติได้
bun run format       # จัดรูปแบบโค้ดด้วย Prettier
bunx --bun shadcn@latest add <component>   # เพิ่ม shadcn component
```

script `dev`, `build` และ `start` รัน Next.js บน Bun runtime ผ่าน `bun --bun` (ต้องใช้ Bun 1.4 ขึ้นไป)

## หมายเหตุ

- **เบราว์เซอร์เป้าหมาย** คือ Chrome และ Edge บน desktop ก่อน export ต้องตรวจ codec จริงด้วย `canEncodeVideo('avc')` และ `canEncodeAudio('aac')`
- **Deploy บน Vercel**: Vercel อ่าน `bun.lock` แล้วรัน `bun install` ให้เอง ไม่ต้องตั้ง COOP/COEP header แต่ script `build` เรียก `bun --bun next build` และ Vercel ต้อง opt-in ถึงจะใช้ Bun 1.4 ได้ ให้ตรวจการตั้งค่านี้ตอน deploy ครั้งแรก
- **`.env` กับ `bun --bun`**: Next.js โหลด `.env*` เอง แต่ Bun 1.4 ไม่โหลด `.env` ให้เมื่อรันแบบ `--bun` ดังนั้น script แยก เช่น seed หรือ migration ต้องใส่ `--env-file=.env.local` เอง
- **Dark mode**: shadcn ใช้ class `.dark` (`@custom-variant dark`) ไม่ใช่ `prefers-color-scheme` ต้องใส่ class `dark` ที่ `<html>` เองถ้าต้องการโหมดมืด
- **ข้อจำกัดเรื่องเวอร์ชัน**:
  - `three` ให้อยู่ที่ 0.186.x เพราะ `postprocessing` รองรับแค่ `<0.187`
  - `@react-three/fiber` ใช้ 9.x ไว้ก่อน เพราะ v10 ยังเป็น alpha
  - ห้ามอัป TypeScript เป็น 7 เพราะ typescript-eslint ยังไม่รองรับ
  - `mediabunny` กับ `@mediabunny/aac-encoder` ต้องเป็นเวอร์ชันเดียวกัน
  - ห้ามติดตั้ง `@dimforge/rapier3d-compat` เอง เพราะ rapier ดึงมาให้แล้ว
- **Client-only**: โค้ดของ R3F, Rapier และ Mediabunny ต้องอยู่ในไฟล์ที่มี `'use client'` และ `<Canvas>` ควรโหลดผ่าน `next/dynamic({ ssr: false })` จาก client component ในโปรเจกต์นี้ทำไว้ที่ `src/features/*/*-loader.tsx`
- **เรื่องที่ต้องทดสอบตอน implement**:
  - ตรวจว่า Turbopack resolve `worker_threads` ใน aac-encoder ได้
  - ตรวจว่า mediabunny ไม่ถูก bundle ซ้ำใน production build (ถ้าซ้ำจะเกิด error `instanceof OutputFormat`) วิธีเลี่ยงคือ import ผ่าน entry เดียว คือ `src/export/mediabunny.ts` ซึ่ง ESLint บังคับไว้แล้ว
- **License**: Mediabunny และ AAC encoder เป็น MPL-2.0 และ AAC encoder มีส่วนของ FFmpeg ที่ compile เป็น WASM อยู่ด้วย
- เอกสารออกแบบต้นทาง: `final-front-end-3d-video-stack.th.md` ฉบับที่ปรับให้ตรงกับโค้ดจริงอยู่ที่ [`docs/architecture.md`](docs/architecture.md)
