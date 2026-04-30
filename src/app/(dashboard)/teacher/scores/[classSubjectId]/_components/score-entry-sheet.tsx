"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Lock, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { upsertScore } from "@/app/actions/score-actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { getStudentsWithScores } from "@/app/actions/score-actions";

type FullPageData = NonNullable<
  Awaited<ReturnType<typeof getStudentsWithScores>>
>;
type Student = FullPageData["students"][number];

interface Props {
  student: Student;
  classSubjectId: string;
  termId: string;
  openWindows: Set<string>;
  onSaved?: () => void;
}

const FIELDS = [
  { key: "assignment1", label: "Assignment 1", max: 5, window: "ASSIGNMENT1" },
  { key: "assignment2", label: "Assignment 2", max: 5, window: "ASSIGNMENT2" },
  { key: "test1", label: "Test 1", max: 15, window: "TEST1" },
  { key: "test2", label: "Test 2", max: 15, window: "TEST2" },
  { key: "exam", label: "Exam", max: 60, window: "EXAM" },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];

// ─── Clamp + round to nearest 0.5 ────────────────────────────────────────────
function clamp(value: number, max: number): number {
  const rounded = Math.round(value * 2) / 2; // nearest 0.5
  return Math.min(Math.max(rounded, 0), max);
}

export function ScoreEntrySheet({
  student,
  classSubjectId,
  termId,
  openWindows,
  onSaved,
}: Props) {
  const sc = student.scores[0];

  const [drafts, setDrafts] = useState<Record<FieldKey, number>>({
    assignment1: sc?.assignment1 ?? 0,
    assignment2: sc?.assignment2 ?? 0,
    test1: sc?.test1 ?? 0,
    test2: sc?.test2 ?? 0,
    exam: sc?.exam ?? 0,
  });

  // Track which fields have a validation error (exceeded max)
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const [isPending, startTransition] = useTransition();

  const liveTotal = FIELDS.reduce((sum, f) => sum + (drafts[f.key] ?? 0), 0);
  const anyOpen = openWindows.size > 0;
  const hasErrors = Object.keys(errors).length > 0;
  const totalValid = liveTotal <= 100;

  // ── Input change: allow free typing, just flag over-max immediately ────────
  function handleChange(field: FieldKey, raw: string, max: number) {
    // Allow empty string while typing
    const numeric = raw === "" ? 0 : parseFloat(raw);
    if (isNaN(numeric)) return;

    setDrafts((prev) => ({ ...prev, [field]: numeric }));

    if (numeric > max) {
      setErrors((prev) => ({
        ...prev,
        [field]: `Max is ${max} — value will be capped on save`,
      }));
    } else if (numeric < 0) {
      setErrors((prev) => ({ ...prev, [field]: "Cannot be negative" }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  // ── Blur: hard-clamp the value so the field always shows a valid number ────
  function handleBlur(field: FieldKey, max: number) {
    setDrafts((prev) => ({ ...prev, [field]: clamp(prev[field], max) }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function save() {
    // Final clamp pass before submitting — belt and suspenders
    const safe = FIELDS.reduce(
      (acc, f) => ({ ...acc, [f.key]: clamp(drafts[f.key], f.max) }),
      {} as Record<FieldKey, number>,
    );
    setDrafts(safe);
    setErrors({});

    startTransition(async () => {
      try {
        await upsertScore({
          studentId: student.id,
          classSubjectId,
          termId,
          ...safe,
        });
        toast.success("Score saved successfully");
        onSaved?.();
      } catch {
        toast.error("Failed to save score. Try again.");
      }
    });
  }

  return (
    <div className="flex flex-col h-full bg-[#050c0a]">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-emerald-900/30">
        <SheetHeader>
          <SheetTitle className="text-white text-base font-bold tracking-tight">
            Score Entry
          </SheetTitle>
        </SheetHeader>

        {/* Student card */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-900/30 bg-[#0a1f14] px-4 py-3">
          <div className="w-9 h-9 rounded-full bg-emerald-900/40 flex items-center justify-center shrink-0">
            <span className="text-sm font-black text-emerald-400">
              {student.user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {student.user.name}
            </p>
            <p className="text-[11px] text-emerald-600 font-mono">
              {student.admissionNo}
            </p>
          </div>
        </div>
      </div>

      {/* ── Body (scrollable) ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {/* No-window warning */}
        {!anyOpen && (
          <div className="flex items-start gap-2 rounded-lg border border-yellow-900/40 bg-yellow-950/20 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-400 leading-relaxed">
              No score windows are currently open. Contact your admin to unlock
              entry.
            </p>
          </div>
        )}

        {/* Score fields */}
        {FIELDS.map((f) => {
          const fieldOpen = openWindows.has(f.window);
          const error = errors[f.key];
          const val = drafts[f.key];
          const overMax = val > f.max;

          return (
            <div key={f.key} className="space-y-1.5">
              {/* Label row */}
              <div className="flex items-center justify-between">
                <label
                  className={cn(
                    "text-xs font-semibold flex items-center gap-1.5",
                    fieldOpen ? "text-emerald-500" : "text-emerald-900",
                  )}
                >
                  {!fieldOpen && <Lock className="h-3 w-3" />}
                  {f.label}
                </label>
                <span
                  className={cn(
                    "text-[10px] font-bold tabular-nums",
                    overMax ? "text-red-400" : "text-emerald-800",
                  )}
                >
                  {val.toFixed(1)} / {f.max}
                </span>
              </div>

              {/* Input + mini progress bar */}
              <div className="space-y-1">
                <Input
                  type="number"
                  inputMode="decimal" // numeric keyboard on mobile
                  min={0}
                  max={f.max}
                  step="0.5"
                  disabled={!fieldOpen || isPending}
                  value={val === 0 ? "" : val}
                  placeholder={`0 – ${f.max}`}
                  onChange={(e) => handleChange(f.key, e.target.value, f.max)}
                  onBlur={() => handleBlur(f.key, f.max)}
                  className={cn(
                    "h-11 text-center text-sm font-bold bg-[#0a1f14] border text-white",
                    "focus-visible:ring-emerald-500/50 placeholder:text-emerald-900",
                    !fieldOpen
                      ? "opacity-40 cursor-not-allowed bg-[#050f0a] border-emerald-900/20"
                      : overMax
                        ? "border-red-500/60 bg-red-950/20"
                        : "border-emerald-900/40",
                  )}
                />

                {/* Progress pip bar */}
                {fieldOpen && (
                  <div className="flex gap-0.5 h-1">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const filled = (val / f.max) * 10 > i;
                      return (
                        <div
                          key={i}
                          className={cn(
                            "flex-1 rounded-full transition-colors",
                            overMax
                              ? "bg-red-500"
                              : filled
                                ? "bg-emerald-500"
                                : "bg-emerald-900/30",
                          )}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <p className="text-[10px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {error}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer (sticky) ─────────────────────────────────────────────── */}
      <div className="border-t border-emerald-900/30 px-5 pt-4 pb-6 space-y-3 bg-[#050c0a]">
        {/* Total */}
        <div className="rounded-xl border border-emerald-900/30 bg-[#071510] px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">
            Total Score
          </span>
          <div className="flex items-center gap-2">
            {totalValid && liveTotal > 0 ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : hasErrors ? (
              <AlertCircle className="h-4 w-4 text-red-400" />
            ) : null}
            <span
              className={cn(
                "text-2xl font-black tabular-nums",
                liveTotal >= 50 ? "text-emerald-300" : "text-red-400",
              )}
            >
              {liveTotal.toFixed(1)}
              <span className="text-sm font-normal text-emerald-700">
                {" "}
                / 100
              </span>
            </span>
          </div>
        </div>

        <Button
          size="lg"
          disabled={!anyOpen || isPending}
          onClick={save}
          className={cn(
            "w-full gap-2 font-bold text-sm h-12 transition-all",
            anyOpen
              ? "bg-emerald-700 hover:bg-emerald-600 text-white"
              : "opacity-50 cursor-not-allowed bg-emerald-900 text-emerald-700",
          )}
        >
          <Save className="h-4 w-4" />
          {isPending ? "Saving…" : "Save Scores"}
        </Button>

        {hasErrors && (
          <p className="text-[10px] text-center text-red-400">
            Over-limit values will be automatically capped on save.
          </p>
        )}
      </div>
    </div>
  );
}
