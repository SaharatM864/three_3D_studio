import {
  Check,
  CircleCheck,
  CircleSlash,
  Copy,
  Download,
  HardDrive,
  MemoryStick,
  TriangleAlert,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { exportPresets, type ExportPresetId } from "@/export/presets";
import type {
  CapabilityReport,
  ExportPhase,
  ExportProgress,
  ExportResult,
} from "@/export/types";
import { errorMessage } from "@/lib/error-message";
import { cn } from "@/lib/utils";
import type { VideoSettings } from "@/model/types";
import type { ExportUiState } from "@/stores/studio-store";

import {
  clipDurationSeconds,
  estimateFileSize,
  formatBitrate,
  formatBytes,
  formatSeconds,
  isPortrait,
} from "../format";

export type ExportDestination = "file-stream" | "memory";

export interface ExportStateViewProps {
  state: ExportUiState;
  video: VideoSettings;
  hasAudio: boolean;
  fileName: string;
  presetId: ExportPresetId;
  destination: ExportDestination;
  exportAvailable: boolean;
  onPresetChange: (id: ExportPresetId) => void;
  onStart: () => void;
  onCancel: () => void;
  onReset: () => void;
  onClose: () => void;
}

const presetIds = Object.keys(exportPresets) as ExportPresetId[];

function isExportPresetId(value: unknown): value is ExportPresetId {
  return typeof value === "string" && value in exportPresets;
}

export function detectExportDestination(): ExportDestination {
  return typeof window !== "undefined" && "showSaveFilePicker" in window
    ? "file-stream"
    : "memory";
}

export function ExportStateView(props: ExportStateViewProps) {
  const { state } = props;

  switch (state.status) {
    case "idle":
      return <ExportSettingsView {...props} />;
    case "checking":
      return <ExportCheckingView />;
    case "unsupported":
      return (
        <ExportUnsupportedView
          report={state.report}
          canUseLighterPreset={props.presetId !== "light"}
          onUseLighterPreset={() => {
            props.onPresetChange("light");
            props.onReset();
          }}
          onBack={props.onReset}
        />
      );
    case "exporting":
      return (
        <ExportProgressView
          progress={state.progress}
          onCancel={props.onCancel}
        />
      );
    case "done":
      return (
        <ExportDoneView
          result={state.result}
          fileName={props.fileName}
          onClose={props.onClose}
          onExportAgain={props.onReset}
        />
      );
    case "cancelled":
      return (
        <ExportCancelledView
          onClose={props.onClose}
          onExportAgain={props.onReset}
        />
      );
    case "failed":
      return (
        <ExportFailedView
          error={state.error}
          onClose={props.onClose}
          onRetry={props.onReset}
        />
      );
  }
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-mono text-xs tabular-nums">
        {children}
      </dd>
    </>
  );
}

export function ExportSettingsView({
  video,
  hasAudio,
  fileName,
  presetId,
  destination,
  exportAvailable,
  onPresetChange,
  onStart,
  onClose,
}: ExportStateViewProps) {
  const preset = exportPresets[presetId];

  return (
    <>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 rounded-lg bg-muted/40 p-3 text-sm">
        <SummaryRow label="ไฟล์">{fileName}</SummaryRow>
        <SummaryRow label="ความละเอียด">
          {video.width}×{video.height} ·{" "}
          {isPortrait(video) ? "แนวตั้ง" : "แนวนอน"}
        </SummaryRow>
        <SummaryRow label="Frame rate">{video.fps} fps</SummaryRow>
        <SummaryRow label="ความยาว">
          {formatSeconds(clipDurationSeconds(video))} · {video.durationInFrames}{" "}
          เฟรม
        </SummaryRow>
        <SummaryRow label="วิดีโอ">
          H.264 · {formatBitrate(preset.video.bitrate)}
        </SummaryRow>
        <SummaryRow label="เสียง">
          {hasAudio
            ? `AAC · ${preset.audio.sampleRate / 1000} kHz · ${formatBitrate(preset.audio.bitrate)}`
            : "ไม่มีเสียง (ไม่สร้าง audio track)"}
        </SummaryRow>
      </dl>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-xs font-medium text-muted-foreground">
          คุณภาพ
        </legend>
        <RadioGroup
          value={presetId}
          onValueChange={(value) => {
            if (isExportPresetId(value)) onPresetChange(value);
          }}
        >
          {presetIds.map((id) => (
            <label
              key={id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/50 has-data-checked:border-primary/60 has-data-checked:bg-muted/60"
            >
              <RadioGroupItem value={id} />
              <span className="text-sm">{exportPresets[id].label}</span>
              <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">
                ~
                {formatBytes(
                  estimateFileSize(exportPresets[id], video, hasAudio)
                )}
              </span>
            </label>
          ))}
        </RadioGroup>
      </fieldset>

      <div className="flex items-start gap-2.5 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
        {destination === "file-stream" ? (
          <>
            <HardDrive className="mt-0.5 size-4 shrink-0" />
            <p>
              หลังกด Export จะให้เลือกตำแหน่งบันทึก แล้วเขียนลงไฟล์โดยตรงระหว่าง
              render ไม่ต้องเก็บทั้งไฟล์ไว้ใน RAM
            </p>
          </>
        ) : (
          <>
            <MemoryStick className="mt-0.5 size-4 shrink-0" />
            <p>
              เบราว์เซอร์นี้เลือกตำแหน่งบันทึกไม่ได้
              ไฟล์จะถูกเก็บในหน่วยความจำแล้วให้ดาวน์โหลดเมื่อเสร็จ
            </p>
          </>
        )}
      </div>

      <DialogFooter className="items-center">
        {!exportAvailable && (
          <p className="mr-auto text-xs text-muted-foreground">
            ยังไม่พร้อมใช้งาน (M1)
          </p>
        )}
        <Button variant="outline" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button disabled={!exportAvailable} onClick={onStart}>
          <Download />
          Export
        </Button>
      </DialogFooter>
    </>
  );
}

export function ExportCheckingView() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-sm text-muted-foreground">
      <Spinner className="size-6" aria-label="กำลังตรวจ codec" />
      <p>กำลังตรวจว่าเบราว์เซอร์ encode H.264 และ AAC ได้…</p>
    </div>
  );
}

const UNSUPPORTED_COPY: Record<
  Exclude<CapabilityReport, { status: "ok" }>["status"],
  { title: string; description: string }
> = {
  "aac-unavailable": {
    title: "encode เสียง AAC ไม่ได้",
    description:
      "เบราว์เซอร์นี้ไม่มี AAC encoder ที่ใช้ได้ แม้ลองตัวสำรอง WASM แล้ว ระบบจะไม่ export โดยตัดเสียงทิ้ง ลองใช้ Chrome หรือ Edge บน desktop",
  },
  "video-config-unsupported": {
    title: "H.264 ใช้ค่าที่เลือกไม่ได้",
    description:
      "เครื่องนี้ encode H.264 ที่ความละเอียด fps หรือ bitrate นี้ไม่ได้ ลองใช้ preset ที่เบากว่า",
  },
  "no-h264": {
    title: "ไม่มี H.264 encoder",
    description:
      "เบราว์เซอร์หรือเครื่องนี้ยัง export MP4 ไม่ได้ ใช้ Chrome หรือ Edge รุ่นล่าสุดบน desktop",
  },
};

export function ExportUnsupportedView({
  report,
  canUseLighterPreset,
  onUseLighterPreset,
  onBack,
}: {
  report: Exclude<CapabilityReport, { status: "ok" }>;
  canUseLighterPreset: boolean;
  onUseLighterPreset: () => void;
  onBack: () => void;
}) {
  const copy = UNSUPPORTED_COPY[report.status];

  return (
    <>
      <Alert variant="destructive">
        <TriangleAlert />
        <AlertTitle>{copy.title}</AlertTitle>
        <AlertDescription>{copy.description}</AlertDescription>
      </Alert>
      <DialogFooter>
        <Button variant="outline" onClick={onBack}>
          กลับไปตั้งค่า
        </Button>
        {report.status === "video-config-unsupported" &&
          canUseLighterPreset && (
            <Button onClick={onUseLighterPreset}>ใช้ preset Light</Button>
          )}
      </DialogFooter>
    </>
  );
}

const PHASES: { phase: ExportPhase; label: string }[] = [
  { phase: "preparing", label: "เตรียม assets และ track" },
  { phase: "rendering", label: "Render ทีละเฟรม" },
  { phase: "finalizing", label: "Finalize ไฟล์" },
];

export function ExportProgressView({
  progress,
  onCancel,
}: {
  progress: ExportProgress;
  onCancel: () => void;
}) {
  const currentIndex = PHASES.findIndex(
    (item) => item.phase === progress.phase
  );
  const value =
    progress.phase === "preparing"
      ? null
      : progress.phase === "finalizing"
        ? 100
        : (progress.frame / Math.max(progress.totalFrames, 1)) * 100;

  return (
    <>
      <ol className="flex flex-col gap-2">
        {PHASES.map((item, index) => {
          const state =
            index < currentIndex
              ? "done"
              : index === currentIndex
                ? "current"
                : "pending";
          return (
            <li
              key={item.phase}
              data-state={state}
              className="flex items-center gap-2.5 text-sm text-muted-foreground data-[state=current]:text-foreground"
            >
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border text-[10px]",
                  state === "done" &&
                    "border-success bg-success/15 text-success",
                  state === "current" && "border-foreground"
                )}
              >
                {state === "done" ? (
                  <Check className="size-3" />
                ) : state === "current" ? (
                  <Spinner className="size-3" aria-label={item.label} />
                ) : (
                  index + 1
                )}
              </span>
              {item.label}
            </li>
          );
        })}
      </ol>

      <Progress value={value} className="gap-2">
        <ProgressLabel className="text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">
            {progress.frame} / {progress.totalFrames}
          </span>{" "}
          เฟรม
        </ProgressLabel>
        <ProgressValue className="font-mono text-xs" />
      </Progress>

      <p className="text-xs text-muted-foreground">
        อย่าปิดหรือสลับแท็บระหว่าง export เบราว์เซอร์อาจพักการทำงานของแท็บ
      </p>

      <DialogFooter>
        <Button variant="destructive" onClick={onCancel}>
          ยกเลิก export
        </Button>
      </DialogFooter>
    </>
  );
}

function ResultHeading({
  icon,
  title,
  description,
  className,
}: {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-4 text-center">
      <div
        className={cn(
          "grid size-10 place-items-center rounded-full bg-muted [&_svg]:size-5",
          className
        )}
      >
        {icon}
      </div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url));
}

export function ExportDoneView({
  result,
  fileName,
  onClose,
  onExportAgain,
}: {
  result: Extract<ExportResult, { status: "done" }>;
  fileName: string;
  onClose: () => void;
  onExportAgain: () => void;
}) {
  return (
    <>
      <ResultHeading
        icon={<CircleCheck />}
        className="bg-success/15 text-success"
        title="Export เสร็จแล้ว"
        description={
          result.destination === "file-stream"
            ? `บันทึก ${fileName} ลงเครื่องแล้ว`
            : `${fileName} พร้อมดาวน์โหลด · ${formatBytes(result.blob.size)}`
        }
      />
      <DialogFooter>
        <Button variant="outline" onClick={onExportAgain}>
          Export อีกครั้ง
        </Button>
        {result.destination === "memory" ? (
          <Button onClick={() => downloadBlob(result.blob, fileName)}>
            <Download />
            ดาวน์โหลด MP4
          </Button>
        ) : (
          <Button onClick={onClose}>ปิด</Button>
        )}
      </DialogFooter>
    </>
  );
}

export function ExportCancelledView({
  onClose,
  onExportAgain,
}: {
  onClose: () => void;
  onExportAgain: () => void;
}) {
  return (
    <>
      <ResultHeading
        icon={<CircleSlash />}
        title="ยกเลิก export แล้ว"
        description="ไฟล์ที่เขียนไปบางส่วนอาจไม่สมบูรณ์ ให้ลบทิ้งแล้ว export ใหม่"
      />
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          ปิด
        </Button>
        <Button onClick={onExportAgain}>Export อีกครั้ง</Button>
      </DialogFooter>
    </>
  );
}

export function ExportFailedView({
  error,
  onClose,
  onRetry,
}: {
  error: unknown;
  onClose: () => void;
  onRetry: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const message = errorMessage(error) || "ไม่ทราบสาเหตุ";
  const details = error instanceof Error && error.stack ? error.stack : message;

  async function copyDetails() {
    await navigator.clipboard.writeText(details);
    setCopied(true);
  }

  return (
    <>
      <Alert variant="destructive">
        <TriangleAlert />
        <AlertTitle>Export ไม่สำเร็จ</AlertTitle>
        <AlertDescription className="font-mono text-xs break-all">
          {message}
        </AlertDescription>
      </Alert>
      <DialogFooter>
        <Button variant="ghost" className="sm:mr-auto" onClick={copyDetails}>
          {copied ? <Check /> : <Copy />}
          {copied ? "คัดลอกแล้ว" : "คัดลอกรายละเอียด"}
        </Button>
        <Button variant="outline" onClick={onClose}>
          ปิด
        </Button>
        <Button onClick={onRetry}>ลองอีกครั้ง</Button>
      </DialogFooter>
    </>
  );
}
