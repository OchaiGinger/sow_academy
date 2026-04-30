// app/teacher/scores/[classSubjectId]/_components/score-entry-table.tsx
"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Lock, Save } from "lucide-react";
import { upsertScore } from "@/app/actions/score-actions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Student = {
  id: string;
  admissionNo: string;
  user: { name: string };
  scores: {
    assignment1: number;
    assignment2: number;
    test1: number;
    test2: number;
    exam: number;
    total: number | null;
    grade: string | null;
  }[];
};

interface Props {
  students: Student[];
  classSubjectId: string;
  termId: string;
  openWindows: Set<string>;
}

const FIELDS = [
  { key: "assignment1", label: "Asmt 1", max: 5, window: "ASSIGNMENT1" },
  { key: "assignment2", label: "Asmt 2", max: 5, window: "ASSIGNMENT2" },
  { key: "test1", label: "Test 1", max: 15, window: "TEST1" },
  { key: "test2", label: "Test 2", max: 15, window: "TEST2" },
  { key: "exam", label: "Exam", max: 60, window: "EXAM" },
] as const;

export function ScoreEntryTable({
  students,
  classSubjectId,
  termId,
  openWindows,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, number>>>(
    () =>
      Object.fromEntries(
        students.map((s) => {
          const sc = s.scores[0];
          return [
            s.id,
            {
              assignment1: sc?.assignment1 ?? 0,
              assignment2: sc?.assignment2 ?? 0,
              test1: sc?.test1 ?? 0,
              test2: sc?.test2 ?? 0,
              exam: sc?.exam ?? 0,
            },
          ];
        }),
      ),
  );
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  function handleChange(studentId: string, field: string, raw: string) {
    const val = parseFloat(raw) || 0;
    setDrafts((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: val },
    }));
  }

  function save(studentId: string) {
    const d = drafts[studentId];
    startTransition(async () => {
      try {
        await upsertScore({
          studentId,
          classSubjectId,
          termId,
          assignment1: d.assignment1,
          assignment2: d.assignment2,
          test1: d.test1,
          test2: d.test2,
          exam: d.exam,
        });
        toast.success("Score saved");
      } catch {
        toast.error("Failed to save score");
      }
    });
  }

  const anyOpen = openWindows.size > 0;

  return (
    <div className="space-y-2">
      {!anyOpen && (
        <div className="rounded-lg border border-yellow-900/40 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-400">
          ⚠️ No score entry windows are currently open. Contact your admin.
        </div>
      )}

      {students.map((student) => {
        const sc = student.scores[0];
        const d = drafts[student.id];
        const liveTotal = FIELDS.reduce((sum, f) => sum + (d[f.key] ?? 0), 0);
        const isOpen = expanded === student.id;

        return (
          <div
            key={student.id}
            className="rounded-xl border border-emerald-900/40 overflow-hidden"
          >
            {/* Row header */}
            <button
              onClick={() => toggle(student.id)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#0a1f14] hover:bg-[#0d2a1a] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {student.user.name}
                  </p>
                  <p className="text-[10px] text-emerald-700">
                    {student.admissionNo}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {sc?.grade && <Badge className="text-[10px]">{sc.grade}</Badge>}
                <span
                  className={cn(
                    "text-sm font-bold",
                    liveTotal >= 50 ? "text-emerald-300" : "text-red-400",
                  )}
                >
                  {liveTotal.toFixed(1)}
                </span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-emerald-600" />
                )}
              </div>
            </button>

            {/* Expandable score form */}
            {isOpen && (
              <div className="px-4 py-4 bg-[#071510] border-t border-emerald-900/40 space-y-4">
                <div className="grid grid-cols-5 gap-3">
                  {FIELDS.map((f) => {
                    const fieldOpen = openWindows.has(f.window);
                    return (
                      <div key={f.key} className="space-y-1">
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600">
                            {f.label}
                          </label>
                          {!fieldOpen && (
                            <Lock className="h-2.5 w-2.5 text-emerald-800" />
                          )}
                        </div>
                        <Input
                          type="number"
                          min={0}
                          max={f.max}
                          step="0.5"
                          disabled={!fieldOpen || isPending}
                          value={d[f.key] ?? 0}
                          onChange={(e) =>
                            handleChange(student.id, f.key, e.target.value)
                          }
                          className={cn(
                            "h-9 text-center text-sm bg-[#0a1f14] border-emerald-900/40 text-white",
                            !fieldOpen &&
                              "opacity-40 cursor-not-allowed bg-[#050f0a]",
                          )}
                          placeholder={`/${f.max}`}
                        />
                        <p className="text-[9px] text-center text-emerald-800">
                          max {f.max}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-emerald-600">
                    Total:
                    <span
                      className={cn(
                        "font-bold",
                        liveTotal >= 50 ? "text-emerald-300" : "text-red-400",
                      )}
                    >
                      {liveTotal.toFixed(1)} / 100
                    </span>
                  </p>
                  <Button
                    size="sm"
                    disabled={!anyOpen || isPending}
                    onClick={() => save(student.id)}
                    className="gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
