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
      <div className="overflow-hidden rounded-xl border-2 border-black bg-white shadow-sm">
        {/* Header (desktop only) */}
        <div className="hidden border-b-2 border-black bg-gray-100 px-3 py-3 text-xs font-black uppercase tracking-wide text-black md:grid md:grid-cols-[2rem_1fr_5rem_5rem_5rem_5rem_5rem_5rem_5rem_4.5rem_3rem] md:items-center md:gap-x-1">
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

        <div className="divide-y-2 divide-gray-300">
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
