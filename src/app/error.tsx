"use client";

import { ErrorScreen } from "@/components/status-screen";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col">
      <ErrorScreen title="เกิดข้อผิดพลาด" error={error} onRetry={retry} />
    </main>
  );
}
