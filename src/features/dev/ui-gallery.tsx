import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { ErrorScreen, LoadingScreen } from "@/components/status-screen";
import { buttonVariants } from "@/components/ui/button";
import { DEFAULT_EXPORT_PRESET, type ExportPresetId } from "@/export/presets";
import { cn } from "@/lib/utils";
import { DEFAULT_VIDEO } from "@/model/defaults";
import { projectLoaders } from "@/projects/loaders";
import { useStudioStore, type ExportUiState } from "@/stores/studio-store";

import { ControlsHelp } from "../playground/components/controls-help";
import { EnvironmentPanel } from "../playground/components/environment-panel";
import { PlaygroundToolbar } from "../playground/components/playground-toolbar";
import { PointerLockOverlay } from "../playground/components/pointer-lock-overlay";
import { InspectorPanel } from "../studio/components/inspector-panel";
import { OutlinerPanel } from "../studio/components/outliner-panel";
import {
  ExportStateView,
  type ExportDestination,
} from "../studio/components/export-views";
import { TimelinePanel } from "../studio/components/timeline-panel";
import { TransportBar } from "../studio/components/transport-bar";
import { StudioControllerProvider } from "../studio/studio-controller";
import { useLazyModule } from "../use-lazy-module";

interface ExportFixture {
  name: string;
  state: ExportUiState;
  exportAvailable?: boolean;
  destination?: ExportDestination;
}

const TOTAL_FRAMES = DEFAULT_VIDEO.durationInFrames;

const EXPORT_FIXTURES: ExportFixture[] = [
  { name: "idle · ยังไม่พร้อม (file-stream)", state: { status: "idle" } },
  {
    name: "idle · พร้อม export (memory)",
    state: { status: "idle" },
    exportAvailable: true,
    destination: "memory",
  },
  { name: "checking", state: { status: "checking" } },
  {
    name: "unsupported · aac-unavailable",
    state: { status: "unsupported", report: { status: "aac-unavailable" } },
  },
  {
    name: "unsupported · video-config-unsupported",
    state: {
      status: "unsupported",
      report: { status: "video-config-unsupported" },
    },
  },
  {
    name: "unsupported · no-h264",
    state: { status: "unsupported", report: { status: "no-h264" } },
  },
  {
    name: "exporting · preparing",
    state: {
      status: "exporting",
      progress: { phase: "preparing", frame: 0, totalFrames: TOTAL_FRAMES },
    },
  },
  {
    name: "exporting · rendering",
    state: {
      status: "exporting",
      progress: { phase: "rendering", frame: 137, totalFrames: TOTAL_FRAMES },
    },
  },
  {
    name: "exporting · finalizing",
    state: {
      status: "exporting",
      progress: {
        phase: "finalizing",
        frame: TOTAL_FRAMES,
        totalFrames: TOTAL_FRAMES,
      },
    },
  },
  {
    name: "done · file-stream",
    state: {
      status: "done",
      result: { status: "done", destination: "file-stream" },
    },
  },
  {
    name: "done · memory",
    state: {
      status: "done",
      result: {
        status: "done",
        destination: "memory",
        blob: new Blob([new Uint8Array(12_480_000)], { type: "video/mp4" }),
      },
    },
  },
  { name: "cancelled", state: { status: "cancelled" } },
  {
    name: "failed",
    state: {
      status: "failed",
      error: new Error("VideoEncoder: encoding error (GPU context lost)"),
    },
  },
];

const noop = () => {};

export function UiGallery() {
  const clipState = useLazyModule(projectLoaders["example-turntable"].clip);
  const resetStudio = useStudioStore((s) => s.reset);
  const [presetId, setPresetId] = useState<ExportPresetId>(
    DEFAULT_EXPORT_PRESET
  );

  useEffect(() => resetStudio(), [resetStudio]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 py-10">
      <header className="flex flex-col gap-3">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 self-start"
          )}
        >
          <ArrowLeft />
          หน้าแรก
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">UI gallery</h1>
        <p className="text-sm text-muted-foreground">
          ทุก state ของ UI ที่ยังเปิดจากแอปจริงไม่ได้จนกว่าจะต่อ function
          ใช้ได้เฉพาะตอน dev
        </p>
      </header>

      <GallerySection
        title="Export dialog"
        description="ExportStateView ในแต่ละ ExportUiState"
      >
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {EXPORT_FIXTURES.map((fixture) => (
            <GalleryFrame key={fixture.name} label={fixture.name}>
              <div className="grid gap-4 rounded-xl bg-popover p-4 text-sm ring-1 ring-foreground/10">
                <ExportStateView
                  state={fixture.state}
                  video={DEFAULT_VIDEO}
                  hasAudio
                  fileName="example-turntable.mp4"
                  presetId={presetId}
                  destination={fixture.destination ?? "file-stream"}
                  exportAvailable={fixture.exportAvailable ?? false}
                  onPresetChange={setPresetId}
                  onStart={noop}
                  onCancel={noop}
                  onReset={noop}
                  onClose={noop}
                />
              </div>
            </GalleryFrame>
          ))}
        </div>
      </GallerySection>

      <GallerySection
        title="Studio panels"
        description="Outliner, Inspector, Transport และ Timeline ด้วยคลิป example-turntable"
      >
        {clipState.status === "ready" ? (
          <StudioControllerProvider video={clipState.module.spec.video}>
            <div className="grid h-[34rem] grid-cols-[14rem_minmax(0,1fr)_18rem] overflow-hidden rounded-xl border">
              <OutlinerPanel clip={clipState.module.spec} />
              <div className="flex min-h-0 flex-col">
                <TransportBar video={clipState.module.spec.video} />
                <TimelinePanel clip={clipState.module.spec} />
              </div>
              <InspectorPanel clip={clipState.module.spec} />
            </div>
          </StudioControllerProvider>
        ) : clipState.status === "loading" ? (
          <LoadingScreen label="กำลังโหลดคลิป…" className="h-40" />
        ) : (
          <ErrorScreen title="โหลดคลิปไม่สำเร็จ" error={clipState.error} />
        )}
      </GallerySection>

      <GallerySection
        title="Status screens"
        description="LoadingScreen และ ErrorScreen"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <GalleryFrame label="LoadingScreen">
            <div className="flex h-64 flex-col rounded-xl border">
              <LoadingScreen label="กำลังโหลดคลิป…" />
            </div>
          </GalleryFrame>
          <GalleryFrame label="ErrorScreen">
            <div className="flex h-64 flex-col rounded-xl border">
              <ErrorScreen
                title="โหลดคลิปไม่สำเร็จ"
                error={new Error("Duplicate object id: hero")}
                onRetry={noop}
              />
            </div>
          </GalleryFrame>
        </div>
      </GallerySection>

      <GallerySection
        title="Playground"
        description="Toolbar, overlay ก่อนล็อกเมาส์, แผงแสงและสภาพแวดล้อม"
      >
        {clipState.status === "ready" && (
          <div className="relative h-[36rem] overflow-hidden rounded-xl border bg-black">
            <PointerLockOverlay />
            <PlaygroundToolbar projectId="example-turntable" />
            <EnvironmentPanel scene={clipState.module.spec} />
          </div>
        )}
        <GalleryFrame label="ControlsHelp">
          <div className="rounded-xl border p-4">
            <ControlsHelp />
          </div>
        </GalleryFrame>
      </GallerySection>
    </div>
  );
}

function GallerySection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 border-b pb-3">
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function GalleryFrame({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="font-mono text-xs text-muted-foreground">
        {label}
      </figcaption>
      {children}
    </figure>
  );
}
