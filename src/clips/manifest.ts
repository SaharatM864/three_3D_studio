/**
 * Clip metadata only — no clip code — so Server Components can import it
 * for listings and generateStaticParams. Keep in sync with ./loaders.ts.
 */

export interface ClipMeta {
  /** Folder name under src/clips and the URL segment of /studio/<id>. */
  id: string;
  title: string;
  description: string;
}

export const clipManifest = [
  {
    id: "example-turntable",
    title: "Example: Turntable",
    description:
      "กล่องหมุนบนพื้น กล้องเคลื่อนด้วย keyframe และไฟ 3 จุด ยาว 10 วินาที",
  },
] as const satisfies readonly ClipMeta[];

export type ClipId = (typeof clipManifest)[number]["id"];

export function isClipId(value: string): value is ClipId {
  return clipManifest.some((clip) => clip.id === value);
}

export function getClipMeta(id: ClipId): ClipMeta {
  const meta = clipManifest.find((clip) => clip.id === id);
  if (!meta) throw new Error(`Unknown clip: ${id}`);
  return meta;
}
