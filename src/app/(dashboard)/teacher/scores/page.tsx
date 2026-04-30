"use client";

import { Badge } from "@/components/ui/badge";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  gradeColor,
  buildPositionMap,
  type ScoreRowWithTotals,
} from "@/utils/score-utils";
import type { getStudentsWithScores } from "@/app/actions/score-actions";

type FullPageData = NonNullable<
  Awaited<ReturnType<typeof getStudentsWithScores>>
>;

interface ResultSheetPreviewProps {
  classSubject: FullPageData["classSubject"] | null | undefined;
  currentTerm: FullPageData["currentTerm"] | null | undefined;
  rows: ScoreRowWithTotals[];
}

export default function ResultSheetPreview({
  classSubject,
  currentTerm,
  rows = [],
}: ResultSheetPreviewProps) {
  // 1. SHOW SKELETON if data is still null
  if (!classSubject || !currentTerm) {
    return <ResultSheetSkeleton />;
  }

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
    <div className="p-6 space-y-6 bg-[#050c0a]">
      <SheetHeader>
        <SheetTitle className="text-white text-lg font-bold">
          Result Sheet Preview
        </SheetTitle>
      </SheetHeader>

      {/* Meta - Optional Chaining is key here */}
      <div className="rounded-xl border border-emerald-900/40 bg-[#0a1f14] p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-emerald-700">Subject</span>
          <span className="text-white font-bold">
            {classSubject?.subject?.name ?? "N/A"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-emerald-700">Class</span>
          <span className="text-white">
            {classSubject?.class?.name ?? "N/A"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-emerald-700">Term</span>
          <span className="text-white">
            {termLabel} Term · {currentTerm?.session?.name ?? "N/A"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Avg" value={avg.toFixed(1)} />
        <StatCard label="Total Students" value={String(safeRows.length)} />
      </div>

      <div className="rounded-xl border border-emerald-900/40 overflow-hidden bg-[#071510]">
        <div className="grid grid-cols-[1.5rem_1fr_3.5rem_3rem] gap-2 px-3 py-2 bg-[#0a1f14] text-[10px] font-bold text-emerald-600 uppercase">
          <span>Pos</span>
          <span>Student</span>
          <span className="text-center">Total</span>
          <span className="text-center">Grade</span>
        </div>

        <div className="divide-y divide-emerald-900/20 max-h-100 overflow-y-auto">
          {sorted.length === 0 ? (
            <div className="p-8 text-center text-xs text-emerald-800">
              No records available
            </div>
          ) : (
            sorted.map((row) => (
              <div
                key={row.studentId}
                className="grid grid-cols-[1.5rem_1fr_3.5rem_3rem] gap-2 px-3 py-2 items-center hover:bg-[#0a1f14]/40"
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
              </div>
            ))
          )}
        </div>
      </div>
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

function ResultSheetSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-6 w-48 bg-emerald-900/20 rounded" />
      <div className="rounded-xl border border-emerald-900/40 bg-[#0a1f14] p-4 space-y-3">
        <div className="h-4 w-full bg-emerald-900/20 rounded" />
        <div className="h-4 w-2/3 bg-emerald-900/20 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-[#071510] rounded-lg border border-emerald-900/40" />
        <div className="h-16 bg-[#071510] rounded-lg border border-emerald-900/40" />
      </div>
      <div className="rounded-xl border border-emerald-900/40 h-64 bg-[#071510]" />
    </div>
  );
}
