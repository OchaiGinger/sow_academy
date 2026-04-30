"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ScoreTableRow } from "../../_components/score-table-row";
import { type ScoreRowWithTotals } from "../../../../../../utils/score-utils";

type ScoreField = "assignment1" | "assignment2" | "test1" | "test2" | "exam";

interface ScoreTableProps {
  rows: ScoreRowWithTotals[];
  positionMap: Map<string, number>;
  savedIds: Set<string>;
  onUpdate: (studentId: string, field: ScoreField, value: number) => void;
}

export function ScoreTable({
  rows,
  positionMap,
  savedIds,
  onUpdate,
}: ScoreTableProps) {
  return (
    <TooltipProvider>
      <div className="rounded-xl border border-emerald-900/40 overflow-hidden bg-[#071510]/60">
        {/* Header (desktop only) */}
        <div className="hidden md:grid grid-cols-[2rem_1fr_5rem_5rem_5rem_5rem_5rem_5rem_5rem_4.5rem_3rem] gap-x-1 px-3 py-2.5 bg-[#0a1f14] border-b border-emerald-900/40 text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
          <span>#</span>
          <span>Student</span>
          <span className="text-center">Asst 1</span>
          <span className="text-center">Asst 2</span>
          <span className="text-center">Test 1</span>
          <span className="text-center">Test 2</span>
          <span className="text-center">Exam</span>
          <span className="text-center">Total</span>
          <span className="text-center">Grade</span>
          <span className="text-center">Remark</span>
          <span className="text-center">Pos</span>
        </div>

        <div className="divide-y divide-emerald-900/30">
          {rows.map((row, idx) => (
            <ScoreTableRow
              key={row.studentId}
              row={row}
              index={idx}
              position={positionMap.get(row.studentId) ?? 0}
              isSaved={savedIds.has(row.studentId) && !row.dirty}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
