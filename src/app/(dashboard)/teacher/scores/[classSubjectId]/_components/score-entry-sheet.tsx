"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  { key: "test1", label: "Test 1", max: 10, window: "TEST1" },
  { key: "test2", label: "Test 2", max: 10, window: "TEST2" },
  { key: "test3", label: "Test 3", max: 10, window: "TEST3" },
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
    test3: sc?.test3 ?? 0,
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
    <div className="flex h-full flex-col bg-white text-black">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="border-b-2 border-black bg-white px-4 py-4 sm:px-6">
        {/* Student card */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border-2 border-black bg-white px-4 py-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black bg-gray-100">
            <span className="text-base font-black text-black">
              {student.user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-black text-black">
              {student.user.name}
            </p>
            <p className="font-mono text-xs font-bold text-black">
              {student.admissionNo}
            </p>
          </div>
        </div>
      </div>

      {/* ── Body (scrollable) ────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-white px-4 py-4 sm:px-6">
        {/* No-window warning */}
        {!anyOpen && (
          <div className="flex items-start gap-2 rounded-lg border-2 border-black bg-gray-100 px-4 py-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-black" />
            <p className="text-sm font-bold leading-relaxed text-black">
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
            <div key={f.key} className="space-y-2 rounded-xl border-2 border-black bg-white p-3 sm:p-4">
              {/* Label row */}
              <div className="flex items-center justify-between">
                <label
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-black sm:text-base",
                    "text-black",
                  )}
                >
                  {!fieldOpen && <Lock className="h-3 w-3" />}
                  {f.label}
                </label>
                <span
                  className={cn(
                    "text-sm font-black tabular-nums text-black",
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
                    "h-12 border-2 bg-white text-center text-lg font-black text-black shadow-sm",
                    "border-black placeholder:text-gray-600 focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                    !fieldOpen
                      ? "cursor-not-allowed border-gray-500 bg-gray-100 text-gray-700 opacity-100"
                      : overMax
                        ? "border-red-700 bg-red-50"
                        : "",
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
                              ? "bg-black"
                              : filled
                                ? "bg-black"
                                : "bg-gray-200",
                          )}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <p className="flex items-center gap-1 text-xs font-bold text-red-800">
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
      <div className="space-y-3 border-t-2 border-black bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
        {/* Total */}
        <div className="flex items-center justify-between rounded-xl border-2 border-black bg-white px-4 py-3">
          <span className="text-sm font-black uppercase tracking-wide text-black">
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
                "text-black",
              )}
            >
              {liveTotal.toFixed(1)}
              <span className="text-base font-black text-black">
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
            "border-2 border-black bg-black text-white hover:bg-gray-800",
            !anyOpen && "cursor-not-allowed border-gray-600 bg-gray-500 text-white opacity-100",
          )}
        >
          <Save className="h-4 w-4" />
          {isPending ? "Saving…" : "Save Scores"}
        </Button>

        {hasErrors && (
          <p className="text-center text-xs font-bold text-red-800">
            Over-limit values will be automatically capped on save.
          </p>
        )}
      </div>
    </div>
  );
}
