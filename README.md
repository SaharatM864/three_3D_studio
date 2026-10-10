# 3D Clip Studio

WebApp สำหรับทำคลิป 3D, เล่นเกม 3D และ export เป็น `.mp4` ได้บนเบราว์เซอร์ การ render, encode และรวมไฟล์ทำบนเครื่องผู้ใช้ทั้งหมด ไม่มี render server

งานแบ่งเป็น **project** (`src/projects/<id>/`) แต่ละ project มีฉากเดียว (`scene.tsx`) ที่ใช้ร่วมกันใน 2 หน้า

- `/projects/<id>/play`: Playground สำหรับเดินดูฉาก (`playground.tsx`)
- `/projects/<id>/studio`: Studio สำหรับตัดต่อและ export คลิป (`clip.tsx`)

สถานะ: **Phase 1** วางโครงสร้างโฟลเดอร์ type contracts และ stub แล้ว แต่ส่วน render และ export ยังไม่ได้ implement (ดู roadmap ใน [`docs/architecture.md`](docs/architecture.md))

## Tech stack

| ชั้น          | Package                                          | ใช้ทำอะไร                                                                                                                    |
| ------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Framework     | `next` 16 (App Router + Turbopack)               | ตัวแอป, routing และ build สำหรับ deploy บน Vercel (ใช้แทน React + Vite ในเอกสารต้นทาง)                                       |
| UI            | `react` / `react-dom` 19                         | สร้าง UI ของ editor, preview controls และหน้าเกม                                                                             |
| ภาษา          | TypeScript 5.9                                   | กำหนด type ของ project, scene, timeline และ export config                                                                    |
| Styling       | Tailwind CSS 4 (`@tailwindcss/postcss`)          | จัดหน้าตา UI                                                                                                                 |
| UI components | shadcn/ui (Base UI, style `base-nova`)           | component สำเร็จรูปใน `src/components/ui` ใช้ `cn` จาก package `cn` และไอคอน `lucide-react`                                  |
| 3D engine     | `three` 0.184 (`three/webgpu`, `three/tsl`)      | render ผ่าน `WebGPURenderer` + node material และทำ post-processing ด้วย `RenderPipeline`                                     |
| ท้องฟ้าและแสง | `@takram/three-atmosphere`, `three-geospatial`   | ท้องฟ้า ดวงอาทิตย์ และ IBL จากพิกัดโลกกับวันเวลา รวมถึง lens flare, TAA และ dithering (WebGPU entry)                         |
| เมฆ           | `@yong_three/three-clouds` (`/webgpu`)           | เมฆเชิงปริมาตรแบบ TSL บน WebGPU จาก fork ของ three-geospatial ใช้ชั่วคราวจนกว่า takram จะออกเมฆ WebGPU (`src/scene/clouds/`) |
| ทะเล          | port จาก Poseidon (ไม่ใช่ package)               | FFT ocean แบบ TSL + compute บน WebGPU port เป็น TypeScript ไว้ใน `src/scene/ocean/` (ไม่เพิ่ม dependency)                    |
| React กับ 3D  | `@react-three/fiber` 9                           | เขียนฉาก three.js เป็น React components และคุม render loop (`frameloop`, `advance()`)                                        |
| 3D helpers    | `@react-three/drei`                              | helper สำเร็จรูป เช่น โหลด GLB/glTF, `KeyboardControls` สำหรับรับปุ่มในเกม                                                   |
| กล้อง         | `camera-controls` 3.1.2                          | orbit, dolly, truck และ smoothing ของกล้อง playground ผ่าน `src/scene/camera/` (`CameraSystem`, `<CameraRig>`)               |
| Physics (เกม) | `@react-three/rapier`                            | ระบบฟิสิกส์ชน/ตก/แรง ใช้ fixed timestep และ step เองได้ เพื่อให้ export ซ้ำได้ผลเหมือนเดิม                                   |
| State         | `zustand`                                        | เก็บ state ของเกมและ editor                                                                                                  |
| Export วิดีโอ | `mediabunny`                                     | encode H.264 และ AAC ผ่าน WebCodecs แล้วรวมเป็นไฟล์ MP4 (`CanvasSource`, `StreamTarget`, `BufferTarget`)                     |
| AAC fallback  | `@mediabunny/aac-encoder`                        | AAC encoder แบบ WASM สำหรับเบราว์เซอร์ที่ไม่มี AAC ในตัว ใช้ dynamic import เฉพาะตอนจำเป็น                                   |
| Types         | `@types/three`, `@types/wicg-file-system-access` | type ของ three.js และ `showSaveFilePicker()` ที่ TypeScript ยังไม่มีในตัว                                                    |
| Tooling       | ESLint, Prettier (+ tailwind plugin)             | ตรวจโค้ดและจัดรูปแบบ                                                                                                         |

### Browser API ที่ใช้ (ไม่ต้องติดตั้ง)

- **WebGPU**: renderer เดียวของทั้ง playground และ studio (ไม่ใช้ WebGL2 fallback ของ `WebGPURenderer` เพราะ node ของ takram ยังทำงานไม่ถูกต้องบน fallback) และขอ `maxSampledTexturesPerShaderStage` 32 ให้เมฆเสมอ
- **WebCodecs**: encoder ของวิดีโอและเสียงในเบราว์เซอร์ ซึ่ง Mediabunny เรียกใช้ให้
- **Web Audio API / OfflineAudioContext**: เล่นเสียงตอน preview และเกม และ mix เสียงตาม timeline ตอน export
- **File System Access API**: เขียนไฟล์ MP4 ลงเครื่องโดยตรงแบบ stream ไม่ต้องเก็บทั้งไฟล์ไว้ใน RAM

### ส่วนที่จะเพิ่มเมื่อจำเป็น (ยังไม่ติดตั้ง)

- effect เพิ่มเติม เช่น bloom, DOF หรือ aerial perspective: เพิ่มเป็น node ใน `src/scene/pipeline/create-scene-pipeline.ts` (ห้ามใช้ `@react-three/postprocessing` เพราะเป็น WebGL)
- `ecctrl`: character controller สำเร็จรูป
- IndexedDB: autosave
- Web Worker / OffscreenCanvas: เพิ่มเมื่อ profiling เจอว่า main thread เป็นคอขวด

ส่วนนี้ตั้งใจไม่ใช้: ffmpeg.wasm, `mp4-muxer` (deprecated), Remotion, MediaRecorder เป็น exporter หลัก

## โครงสร้างโฟลเดอร์

```text
src/
├── app/           routing เท่านั้น: /, /projects/[projectId]/studio, /projects/[projectId]/play, /dev/ui
├── features/      UI ของ studio และ playground (*-loader.tsx เป็น client boundary)
├── projects/      project ที่ AI เขียน (<id>/scene.tsx, playground.tsx, clip.tsx) + define.ts, manifest.ts, loaders.ts (_template สำหรับคัดลอก)
├── model/         type ของ scene/clip/playground และ composeClip (pure TS)
├── timeline/      evaluateClip(clip, frame), evaluateScene, easing, interpolation, seeded random (pure TS)
├── presets/       preset แสง วัสดุ สภาพแวดล้อม และค่าเริ่มต้นของเมฆกับทะเล (pure data)
├── scene/         ชั้น render ด้วย R3F + WebGPU: canvas กลาง, atmosphere (takram), clouds (adapter ของไลบรารีเมฆ + textures), ocean (FFT ocean), post pipeline, scene content, render bridge, frame driver
├── game/          playground: controls, physics, player, playground scene
├── audio/         โหลดเสียง, เล่นตอน preview, offline mix
├── export/        capability check, AAC fallback, output target, export loop
├── compositing/   overlay 2D ที่ต้องติดไปในวิดีโอ
├── stores/        zustand store สำหรับ state ของ UI
├── components/    shadcn ui + status-screen (loading/error)
└── lib/           utils, notImplemented
public/assets/     ใช้ร่วมกัน: models, textures, hdri, audio, fonts, clouds · เฉพาะ project: projects/<id>/
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

- **เบราว์เซอร์เป้าหมาย** คือ Chrome และ Edge บน desktop ที่รองรับ WebGPU ถ้าไม่รองรับ หน้า playground จะแสดงข้อความแจ้ง ก่อน export ต้องตรวจ codec จริงด้วย `canEncodeVideo('avc')` และ `canEncodeAudio('aac')`
- **Deploy บน Vercel**: Vercel อ่าน `bun.lock` แล้วรัน `bun install` ให้เอง ไม่ต้องตั้ง COOP/COEP header แต่ script `build` เรียก `bun --bun next build` และ Vercel ต้อง opt-in ถึงจะใช้ Bun 1.4 ได้ ให้ตรวจการตั้งค่านี้ตอน deploy ครั้งแรก
- **`.env` กับ `bun --bun`**: Next.js โหลด `.env*` เอง แต่ Bun 1.4 ไม่โหลด `.env` ให้เมื่อรันแบบ `--bun` ดังนั้น script แยก เช่น seed หรือ migration ต้องใส่ `--env-file=.env.local` เอง
- **ธีม**: แอปใช้ธีมมืดถาวร (class `dark` ที่ `<html>` ใน `src/app/layout.tsx`) เพราะ shadcn ใช้ class `.dark` (`@custom-variant dark`) ไม่ใช่ `prefers-color-scheme` ฟอนต์ไทยใช้ Noto Sans Thai เป็น fallback ของ Geist
- **UI gallery**: เปิด `/dev/ui` ตอน `bun dev` เพื่อดูทุก state ของ UI ที่ยังต่อ function ไม่ครบ (production build ขึ้น 404)
- **ข้อจำกัดเรื่องเวอร์ชัน**:
  - `three` pin ไว้ที่ 0.184.0 และ `@types/three` ที่ 0.184.x เพราะ `@takram/three-atmosphere@0.19.1` crash ตอน import บน three 0.185 ขึ้นไป ([issue #111](https://github.com/takram-design-engineering/three-geospatial/issues/111)) อัปเกรดได้เมื่อ takram ออกเวอร์ชันที่รวม [PR #118](https://github.com/takram-design-engineering/three-geospatial/pull/118)
  - `@takram/three-atmosphere` กับ `@takram/three-geospatial` pin แบบ exact เพราะยังเป็น alpha และ atmosphere ผูกเวอร์ชัน geospatial ไว้ตายตัว
  - `postprocessing` ถูกติดตั้งมาเพราะเป็น required peer ของ three-atmosphere และ three-clouds เท่านั้น ห้ามนำมาใช้ (เป็น WebGL) และห้ามติดตั้ง `@react-three/postprocessing`
  - `@yong_three/three-clouds` pin แบบ exact ที่ 0.1.3 เป็น fork ที่ pin atmosphere 0.19.1 กับ geospatial 0.9.1 ตรงกับของเรา และต้องการ `three >=0.184.0 <0.185.0` ใช้เฉพาะ entry `/webgpu` ผ่าน `src/scene/clouds/three-clouds.ts` (ESLint บังคับ) เพราะ entry หลักเป็น GLSL บน `postprocessing`
  - `patches/` มี fix จาก `bun patch` ที่ upstream ยังไม่ release: `@yong_three/three-clouds@0.1.3` (6 ข้อจาก fork commit `696948c321`) และ `@takram/three-atmosphere@0.19.1` (`matrixECEFToWorld` ใช้ `invert()` แทน `transpose()`) เมื่ออัปเกรดสองแพ็กเกจนี้ให้ลบ patch ที่ upstream แก้แล้ว และ patch ใหม่ถ้ายังจำเป็น (ดู "Clouds" ใน `docs/architecture.md`)
  - texture ใน `public/assets/clouds/` คัดลอกจาก `@takram/three-clouds` 0.7.6 (fork ใช้ชุดเดียวกัน) และเป็นค่าอ้างอิงของ `src/presets/clouds.ts` กับ `src/scene/clouds/quality.ts` เมื่อเปลี่ยนไลบรารีเมฆให้คัดลอก texture และตรวจค่าซ้ำ
  - `camera-controls` pin แบบ exact ที่ 3.1.2 (drei 10.7.9 ขอ `^3.1.0` จึงได้สำเนาเดียวกัน) import ผ่าน `src/scene/camera/camera-controls.ts` เท่านั้น และห้ามใช้ controls หรือกล้องของ drei (ESLint บังคับ) ก่อนอัปเกรดให้อ่าน release notes เพราะ `CameraSystem` พึ่งพฤติกรรมของ `setLookAt`, `update` และ event ของไลบรารี
  - `@react-three/fiber` ใช้ 9.x ไว้ก่อน เพราะ v10 ยังเป็น alpha
  - ห้ามอัป TypeScript เป็น 7 เพราะ typescript-eslint ยังไม่รองรับ
  - `mediabunny` กับ `@mediabunny/aac-encoder` ต้องเป็นเวอร์ชันเดียวกัน
  - ห้ามติดตั้ง `@dimforge/rapier3d-compat` เอง เพราะ rapier ดึงมาให้แล้ว
- **Client-only**: โค้ดของ R3F, Rapier และ Mediabunny ต้องอยู่ในไฟล์ที่มี `'use client'` และ `<Canvas>` ควรโหลดผ่าน `next/dynamic({ ssr: false })` จาก client component ในโปรเจกต์นี้ทำไว้ที่ `src/features/*/*-loader.tsx`
- **เรื่องที่ต้องทดสอบตอน implement**:
  - ตรวจว่า Turbopack resolve `worker_threads` ใน aac-encoder ได้
  - ตรวจว่า mediabunny ไม่ถูก bundle ซ้ำใน production build (ถ้าซ้ำจะเกิด error `instanceof OutputFormat`) วิธีเลี่ยงคือ import ผ่าน entry เดียว คือ `src/export/mediabunny.ts` ซึ่ง ESLint บังคับไว้แล้ว
- **License**: Mediabunny และ AAC encoder เป็น MPL-2.0 และ AAC encoder มีส่วนของ FFmpeg ที่ compile เป็น WASM อยู่ด้วย
  - โค้ดใน `src/scene/ocean/` port มาจาก [Poseidon](https://github.com/owenyuwono/poseidon) commit `671053b812` (MIT) ซึ่งดัดแปลงเทคนิคจาก gasgiant/FFT-Ocean (MIT) ข้อความ license ฉบับเต็มและที่มาอยู่ใน `src/scene/ocean/LICENSE` ต้องเก็บไฟล์นี้ไว้กับโค้ด
- เอกสารออกแบบต้นทาง: `final-front-end-3d-video-stack.th.md` ฉบับที่ปรับให้ตรงกับโค้ดจริงอยู่ที่ [`docs/architecture.md`](docs/architecture.md)
