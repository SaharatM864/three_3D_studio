import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Panel({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn("flex min-h-0 min-w-0 flex-col bg-background", className)}
      {...props}
    />
  );
}

export function PanelHeader({
  title,
  children,
  className,
}: {
  title: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex h-9 shrink-0 items-center gap-2 border-b px-3",
        className
      )}
    >
      <h2 className="text-xs font-medium text-muted-foreground">{title}</h2>
      {children && (
        <div className="ml-auto flex items-center gap-1">{children}</div>
      )}
    </header>
  );
}
