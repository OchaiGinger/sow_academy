"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  gradeColor,
  buildPositionMap,
  type ScoreRowWithTotals,
} from "@/utils/score-utils";
import { ChevronRight } from "lucide-react";
import type { getStudentsWithScores } from "@/app/actions/score-actions";

type FullPageData = NonNullable<
  Awaited<ReturnType<typeof getStudentsWithScores>>
>;

interface ResultSheetPreviewProps {
  classSubject: FullPageData["classSubject"];
  currentTerm: FullPageData["currentTerm"];
  rows: ScoreRowWithTotals[];
  students: FullPageData["students"];
  onStudentClick?: (student: FullPageData["students"][number]) => void;
}

export default function ResultSheetPreview({
  classSubject,
  currentTerm,
  rows = [],
  students,
  onStudentClick,
}: ResultSheetPreviewProps) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const positionMap = buildPositionMap(safeRows);
  const sorted = [...safeRows].sort(
    (a, b) =>
      (positionMap.get(a.studentId) ?? 99) -
      (positionMap.get(b.studentId) ?? 99),
  );

  const avg = safeRows.length
    ? safeRows.reduce((s, r) => s + (r.total || 0), 0) / safeRows.length
    : 0;

  const termName = currentTerm?.name ?? "";
  const termLabel = termName
    ? termName.charAt(0) + termName.slice(1).toLowerCase()
    : "N/A";

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Class Avg" value={avg.toFixed(1)} />
        <StatCard label="Students" value={String(safeRows.length)} />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-emerald-900/40 overflow-hidden bg-[#071510]">
        <div className="grid grid-cols-[1.5rem_1fr_3.5rem_3rem_1rem] gap-2 px-3 py-2 bg-[#0a1f14] text-[10px] font-bold text-emerald-600 uppercase">
          <span>Pos</span>
          <span>Student</span>
          <span className="text-center">Total</span>
          <span className="text-center">Grade</span>
          <span />
        </div>

        <div className="divide-y divide-emerald-900/20">
          {sorted.length === 0 ? (
            <div className="p-8 text-center text-xs text-emerald-800">
              No records yet. Tap a student to enter scores.
            </div>
          ) : (
            sorted.map((row) => {
              const student = students.find((s) => s.id === row.studentId);
              return (
                <button
                  key={row.studentId}
                  onClick={() => student && onStudentClick?.(student)}
                  className="w-full grid grid-cols-[1.5rem_1fr_3.5rem_3rem_1rem] gap-2 px-3 py-3 items-center hover:bg-[#0a1f14]/60 transition-colors text-left"
                >
                  <span className="text-[10px] text-emerald-500 font-bold">
                    {positionMap.get(row.studentId) ?? "-"}
                  </span>
                  <span className="text-xs text-white truncate font-medium">
                    {row?.name ?? "Unknown"}
                  </span>
                  <span className="text-xs font-bold text-emerald-300 text-center">
                    {(row?.total ?? 0).toFixed(1)}
                  </span>
                  <div className="flex justify-center">
                    <Badge
                      className={cn(
                        "text-[9px] px-1 py-0 border",
                        gradeColor(row?.grade ?? "F9"),
                      )}
                    >
                      {row?.grade ?? "F9"}
                    </Badge>
                  </div>
                  <ChevronRight className="h-3 w-3 text-emerald-800" />
                </button>
              );
            })
          )}
        </div>
      </div>

      {onStudentClick && sorted.length > 0 && (
        <p className="text-[10px] text-emerald-800 text-center">
          Tap a student to enter or edit their scores
        </p>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-emerald-900/40 bg-[#071510] p-3 text-center">
      <div className="text-lg font-bold text-emerald-300">{value}</div>
      <div className="text-[10px] text-emerald-700 uppercase">{label}</div>
    </div>
  );
}
