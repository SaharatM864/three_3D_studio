import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PlaceholderProps {
  title: string;
  /** Roadmap milestone that implements this panel, e.g. "M2". */
  milestone: string;
  className?: string;
  children?: ReactNode;
}

/** Marks scaffolded UI that is not implemented yet. */
export function Placeholder({
  title,
  milestone,
  className,
  children,
}: PlaceholderProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium text-foreground">{title}</h2>
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
          {milestone}
        </span>
      </div>
      {children}
    </section>
  );
}
