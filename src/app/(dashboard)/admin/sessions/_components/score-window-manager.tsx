"use client";

import { useEffect, useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  getOrCreateScoreWindows,
  toggleScoreWindow,
} from "@/app/actions/score-window-actions";
import { ScoreComponent } from "@prisma/client";

interface Window {
  id: string;
  component: ScoreComponent;
  isOpen: boolean;
  opensAt: Date | null;
  closesAt: Date | null;
}

const LABELS: Record<ScoreComponent, string> = {
  ASSIGNMENT1: "Assignment 1 (max 5)",
  ASSIGNMENT2: "Assignment 2 (max 5)",
  TEST1: "Test 1 (max 15)",
  TEST2: "Test 2 (max 15)",
  EXAM: "Exam (max 60)",
};

export function ScoreWindowManager({ termId }: { termId: string }) {
  const [windows, setWindows] = useState<Window[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Fetch data on mount or when termId changes
    getOrCreateScoreWindows(termId).then((data) =>
      setWindows(data as Window[]),
    );
  }, [termId]);

  function handleToggle(component: ScoreComponent, checked: boolean) {
    const win = windows.find((w) => w.component === component);

    // Optimistic UI Update
    setWindows((prev) =>
      prev.map((w) =>
        w.component === component ? { ...w, isOpen: checked } : w,
      ),
    );

    startTransition(async () => {
      await toggleScoreWindow(
        termId,
        component,
        checked,
        win?.opensAt?.toISOString().slice(0, 10) ?? null,
        win?.closesAt?.toISOString().slice(0, 10) ?? null,
      );
    });
  }

  function handleDate(
    component: ScoreComponent,
    field: "opensAt" | "closesAt",
    value: string,
  ) {
    const dateValue = value ? new Date(value) : null;

    // Update local state immediately
    setWindows((prev) =>
      prev.map((w) =>
        w.component === component ? { ...w, [field]: dateValue } : w,
      ),
    );

    const win = windows.find((w) => w.component === component)!;
    const opensAt =
      field === "opensAt"
        ? value || null
        : (win.opensAt?.toISOString().slice(0, 10) ?? null);
    const closesAt =
      field === "closesAt"
        ? value || null
        : (win.closesAt?.toISOString().slice(0, 10) ?? null);

    startTransition(() =>
      toggleScoreWindow(termId, component, win.isOpen, opensAt, closesAt),
    );
  }

  // --- LOADING STATE (Skeleton) ---
  if (!windows.length) {
    return (
      <div className="space-y-4 w-full">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-32 rounded-lg border bg-muted/20 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Score Entry Windows
        </p>
        {isPending && (
          <span className="text-[10px] text-primary animate-pulse font-medium">
            Saving changes...
          </span>
        )}
      </div>

      {/* Main Grid Container */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full">
        {windows.map((w) => (
          <div
            key={w.component}
            className={`rounded-lg border p-4 space-y-3 transition-all duration-200 ${
              w.isOpen
                ? "bg-card border-emerald-500/30 shadow-sm"
                : "bg-muted/10 border-border opacity-80"
            }`}
          >
            {/* Header: Label and Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">
                {LABELS[w.component]}
              </span>
              <div className="flex items-center gap-3">
                <Badge
                  variant={w.isOpen ? "default" : "secondary"}
                  className={`text-[10px] h-5 transition-colors ${
                    w.isOpen ? "bg-emerald-600 hover:bg-emerald-600" : ""
                  }`}
                >
                  {w.isOpen ? "Open" : "Closed"}
                </Badge>
                <Switch
                  checked={w.isOpen}
                  onCheckedChange={(v) => handleToggle(w.component, v)}
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Date Controls */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  Opens On
                </Label>
                <Input
                  type="date"
                  className="h-9 text-xs focus-visible:ring-emerald-500/50"
                  value={
                    w.opensAt
                      ? new Date(w.opensAt).toISOString().slice(0, 10)
                      : ""
                  }
                  onChange={(e) =>
                    handleDate(w.component, "opensAt", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground">
                  Closes On
                </Label>
                <Input
                  type="date"
                  className="h-9 text-xs focus-visible:ring-emerald-500/50"
                  value={
                    w.closesAt
                      ? new Date(w.closesAt).toISOString().slice(0, 10)
                      : ""
                  }
                  onChange={(e) =>
                    handleDate(w.component, "closesAt", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
