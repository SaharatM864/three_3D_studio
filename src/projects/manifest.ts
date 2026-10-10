/**
 * Project metadata only — no project code — so Server Components can import
 * it for listings and generateStaticParams. Keep in sync with ./loaders.ts.
 */

export interface ProjectMeta {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
}

export const projectManifest = [
  {
    id: "example-turntable",
    title: "Example: Turntable",
    description:
      "กล่องหมุนบนพื้น กล้องเคลื่อนด้วย keyframe และไฟ 3 จุด ยาว 10 วินาที",
  },
  {
    id: "showroom",
    title: "Showroom",
    description:
      "แท่นโชว์วัสดุทุก preset ไว้เดินดูแสง สี และวัสดุ พร้อมคลิปกล้องเลื่อนผ่าน",
  },
  {
    id: "underwater",
    title: "Underwater",
    description:
      "ฉากทดสอบใต้ทะเล พื้นทราย หิน เสาท่า และลูกบอลแดงขาวไว้ดูการดูดกลืนแสง พร้อมคลิปกล้องลอยขึ้นทะลุผิวน้ำ",
  },
  {
    id: "sea-trial",
    title: "Sea Trial",
    description:
      "ทะเลทดสอบการลอยตัว เรือวิ่งวนเป็นวง เรือยอชต์จอด ทุ่น และลังที่หนักไม่เท่ากัน",
  },
] as const satisfies readonly ProjectMeta[];

export type ProjectId = (typeof projectManifest)[number]["id"];

export function isProjectId(value: string): value is ProjectId {
  return projectManifest.some((project) => project.id === value);
}

export function getProjectMeta(id: ProjectId): ProjectMeta {
  const meta = projectManifest.find((project) => project.id === id);
  if (!meta) throw new Error(`Unknown project: ${id}`);
  return meta;
}
