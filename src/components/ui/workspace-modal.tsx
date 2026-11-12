"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type WorkspaceModalSize = "medium" | "wide";
type WorkspaceModalTone = "default" | "light";

interface WorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: WorkspaceModalSize;
  tone?: WorkspaceModalTone;
  children: ReactNode;
  className?: string;
}

const sizeClasses: Record<WorkspaceModalSize, string> = {
  medium: "max-w-2xl",
  wide: "max-w-6xl",
};

/** Centered popup modal for focused, multi-field workspace flows. */
export function WorkspaceModal({
  open,
  onOpenChange,
  title,
  description,
  size = "medium",
  tone = "default",
  children,
  className,
}: WorkspaceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex h-[min(94dvh,900px)] w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden rounded-xl border p-0 shadow-2xl sm:w-[calc(100vw-2rem)]",
          tone === "light" ? "border-2 border-black bg-white text-black" : "border-border bg-background text-foreground",
          sizeClasses[size],
          className,
        )}
      >
        <DialogHeader className={cn(
          "shrink-0 border-b px-4 py-4 pr-12 text-left sm:px-7 sm:py-5",
          tone === "light" ? "border-black bg-white" : "border-border bg-background",
        )}>
          <DialogTitle className={cn(
            "text-xl font-black tracking-tight sm:text-2xl",
            tone === "light" ? "text-black" : "text-foreground",
          )}>
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className={cn(
              "text-sm font-medium",
              tone === "light" ? "text-gray-700" : "text-muted-foreground",
            )}>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
