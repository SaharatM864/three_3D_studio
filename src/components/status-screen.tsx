import { ArrowLeft, RotateCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { errorMessage } from "@/lib/error-message";
import { cn } from "@/lib/utils";

export function LoadingScreen({
  label,
  progress,
  className,
}: {
  label: string;
  progress?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-sm text-muted-foreground",
        className
      )}
    >
      <Spinner className="size-5" aria-label={label} />
      <p>{label}</p>
      {progress !== undefined && (
        <Progress
          value={Math.round(progress * 100)}
          aria-label={label}
          className="w-48"
        />
      )}
    </div>
  );
}

export function ErrorScreen({
  title,
  error,
  onRetry,
  backHref = "/",
  className,
}: {
  title: string;
  error?: unknown;
  onRetry?: () => void;
  backHref?: string;
  className?: string;
}) {
  const message = errorMessage(error);
  const stack = error instanceof Error ? error.stack : undefined;

  return (
    <Empty className={cn("min-h-0", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="text-destructive">
          <TriangleAlert />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {message && <EmptyDescription>{message}</EmptyDescription>}
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          {onRetry && (
            <Button size="sm" onClick={onRetry}>
              <RotateCcw />
              ลองใหม่
            </Button>
          )}
          <Link
            href={backHref}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft />
            กลับหน้าแรก
          </Link>
        </div>
        {stack && (
          <details className="w-full text-left">
            <summary className="cursor-pointer text-xs text-muted-foreground">
              รายละเอียด
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted p-2 font-mono text-[11px] whitespace-pre-wrap">
              {stack}
            </pre>
          </details>
        )}
      </EmptyContent>
    </Empty>
  );
}
