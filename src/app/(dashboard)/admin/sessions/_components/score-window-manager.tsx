"use client";

import { useEffect, useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ScoreComponent } from "@prisma/client";
import {
  getOrCreateScoreWindows,
  toggleScoreWindow,
} from "@/app/actions/score-window-actions";

interface Window {
  id: string;
  component: ScoreComponent;
  isOpen: boolean;
}

const LABELS: Record<ScoreComponent, string> = {
  ASSIGNMENT1: "Assignment 1 (max 5)",
  ASSIGNMENT2: "Assignment 2 (max 5)",
  TEST1: "Test 1 (max 10)",
  TEST2: "Test 2 (max 10)",
  TEST3: "Test 3 (max 10)",
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
    // Optimistic UI Update
    setWindows((prev) =>
      prev.map((w) =>
        w.component === component ? { ...w, isOpen: checked } : w,
      ),
    );

    startTransition(async () => {
      await toggleScoreWindow(termId, component, checked);
    });
  }

  function handleToggleAll(checked: boolean) {
    setWindows((previous) => previous.map((window) => ({ ...window, isOpen: checked })));
    startTransition(async () => {
      await Promise.all(windows.map((window) => toggleScoreWindow(termId, window.component, checked)));
    });
  }

  // --- LOADING STATE (Skeleton) ---
  if (!windows.length) {
    return (
      <div className="space-y-4 w-full">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Score Entry Windows</p>
          <p className="mt-1 text-xs text-muted-foreground">Open or close each score component directly. No date scheduling required.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {isPending && <span className="text-[10px] font-medium text-primary">Saving…</span>}
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => handleToggleAll(true)}>Open all</Button>
          <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => handleToggleAll(false)}>Close all</Button>
        </div>
      </div>

      {/* Main Grid Container */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full">
        {windows.map((w) => (
          <div
            key={w.component}
            className={`rounded-xl border p-4 space-y-3 transition-all duration-200 ${
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

            <div className="flex items-center justify-between border-t border-border/50 pt-3">
              <p className="text-xs text-muted-foreground">Maximum score</p>
              <p className="text-sm font-black text-foreground">{LABELS[w.component].match(/max (\d+)/)?.[1] ?? "—"} marks</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
