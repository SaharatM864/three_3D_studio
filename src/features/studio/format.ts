import type { ExportPreset } from "@/export/types";
import type { VideoSettings } from "@/model/types";
import { frameToSeconds } from "@/timeline/time";

const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3,
});

const secondsFormat = new Intl.NumberFormat("th-TH", {
  maximumFractionDigits: 2,
});

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function formatTimecode(frame: number, fps: number): string {
  const totalSeconds = Math.floor(frame / fps);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const frames = Math.round(frame - totalSeconds * fps);
  return `${pad(minutes)}:${pad(seconds)}.${pad(frames)}`;
}

export function formatSeconds(seconds: number): string {
  return `${secondsFormat.format(seconds)} วินาที`;
}

export function clipDurationSeconds(video: VideoSettings): number {
  return frameToSeconds(video.durationInFrames, video.fps);
}

export function formatBitrate(bitsPerSecond: number): string {
  if (bitsPerSecond >= 1_000_000) {
    return `${formatNumber(bitsPerSecond / 1_000_000)} Mbps`;
  }
  return `${formatNumber(bitsPerSecond / 1_000)} kbps`;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) {
    return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
  }
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function estimateFileSize(
  preset: ExportPreset,
  video: VideoSettings,
  hasAudio: boolean
): number {
  const bitrate = preset.video.bitrate + (hasAudio ? preset.audio.bitrate : 0);
  return (bitrate * clipDurationSeconds(video)) / 8;
}

export function isPortrait(video: VideoSettings): boolean {
  return video.height > video.width;
}
