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
  rows: ScoreRowWithTotals[];
  students: FullPageData["students"];
  onStudentClick?: (student: FullPageData["students"][number]) => void;
}

export default function ResultSheetPreview({
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

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Class Avg" value={avg.toFixed(1)} />
        <StatCard label="Students" value={String(safeRows.length)} />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border-2 border-black bg-white shadow-sm">
        <div className="grid grid-cols-[2rem_1fr_4rem_3.5rem_1rem] gap-2 border-b-2 border-black bg-gray-100 px-3 py-3 text-xs font-black uppercase tracking-wide text-black sm:grid-cols-[2.5rem_1fr_5rem_4rem_1rem]">
          <span>Pos</span>
          <span>Student</span>
          <span className="text-center">Total</span>
          <span className="text-center">Grade</span>
          <span />
        </div>

        <div className="divide-y divide-gray-300">
          {sorted.length === 0 ? (
            <div className="p-8 text-center text-sm font-bold text-black">
              No records yet. Tap a student to enter scores.
            </div>
          ) : (
            sorted.map((row) => {
              const student = students.find((s) => s.id === row.studentId);
              return (
                <button
                  key={row.studentId}
                  onClick={() => student && onStudentClick?.(student)}
                  className="grid w-full grid-cols-[2rem_1fr_4rem_3.5rem_1rem] items-center gap-2 px-3 py-4 text-left text-black transition-colors hover:bg-gray-100 sm:grid-cols-[2.5rem_1fr_5rem_4rem_1rem]"
                >
                  <span className="text-sm font-black text-black">
                    {positionMap.get(row.studentId) ?? "-"}
                  </span>
                  <span className="truncate text-sm font-bold text-black sm:text-base">
                    {row?.name ?? "Unknown"}
                  </span>
                  <span className="text-sm font-black text-black text-center">
                    {(row?.total ?? 0).toFixed(1)}
                  </span>
                  <div className="flex justify-center">
                    <Badge
                      className={cn(
                        gradeColor(row?.grade ?? "F9"),
                        "border-black bg-white px-1.5 py-0 text-xs font-black text-black",
                      )}
                    >
                      {row?.grade ?? "F9"}
                    </Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 text-black" />
                </button>
              );
            })
          )}
        </div>
      </div>

      {onStudentClick && sorted.length > 0 && (
        <p className="text-center text-xs font-bold text-black">
          Tap a student to enter or edit their scores
        </p>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border-2 border-black bg-white p-3 text-center shadow-sm">
      <div className="text-2xl font-black text-black">{value}</div>
      <div className="text-xs font-black uppercase tracking-wide text-black">{label}</div>
    </div>
  );
}
