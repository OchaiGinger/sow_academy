"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, AlertCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoreSelect } from "./score-select";
import {
  gradeColor,
  ordinal,
  ASSIGNMENT_OPTS,
  TEST_OPTS,
  EXAM_OPTS,
  type ScoreRowWithTotals,
} from "@/utils/score-utils";

type ScoreField = "assignment1" | "assignment2" | "test1" | "test2" | "exam";

interface ScoreTableRowProps {
  row: ScoreRowWithTotals;
  index: number;
  position: number;
  isSaved: boolean;
  onUpdate: (studentId: string, field: ScoreField, value: number) => void;
}

const MOBILE_COLS: { label: string; field: ScoreField; opts: string[] }[] = [
  { label: "A1", field: "assignment1", opts: ASSIGNMENT_OPTS },
  { label: "A2", field: "assignment2", opts: ASSIGNMENT_OPTS },
  { label: "T1", field: "test1", opts: TEST_OPTS },
  { label: "T2", field: "test2", opts: TEST_OPTS },
  { label: "Exam", field: "exam", opts: EXAM_OPTS },
];

export function ScoreTableRow({
  row,
  index,
  position,
  isSaved,
  onUpdate,
}: ScoreTableRowProps) {
  const rowBg = row.dirty
    ? "bg-amber-950/20"
    : isSaved
      ? "bg-emerald-950/20"
      : "hover:bg-[#0a1f14]/60";

  return (
    <div className={cn("px-3 py-2.5 transition-colors", rowBg)}>
      {/* Desktop */}
      <div className="hidden md:grid grid-cols-[2rem_1fr_5rem_5rem_5rem_5rem_5rem_5rem_5rem_4.5rem_3rem] gap-x-1 items-center">
        <span className="text-emerald-700 text-xs">{index + 1}</span>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-emerald-900/60 border border-emerald-800/50 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate leading-tight">
              {row.name}
            </p>
            <p className="text-[10px] text-emerald-700">{row.admissionNo}</p>
          </div>
          {isSaved && (
            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
          )}
          {row.dirty && (
            <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
          )}
        </div>

        <ScoreSelect
          value={row.assignment1}
          options={ASSIGNMENT_OPTS}
          onChange={(v) => onUpdate(row.studentId, "assignment1", v)}
        />
        <ScoreSelect
          value={row.assignment2}
          options={ASSIGNMENT_OPTS}
          onChange={(v) => onUpdate(row.studentId, "assignment2", v)}
        />
        <ScoreSelect
          value={row.test1}
          options={TEST_OPTS}
          onChange={(v) => onUpdate(row.studentId, "test1", v)}
        />
        <ScoreSelect
          value={row.test2}
          options={TEST_OPTS}
          onChange={(v) => onUpdate(row.studentId, "test2", v)}
        />
        <ScoreSelect
          value={row.exam}
          options={EXAM_OPTS}
          onChange={(v) => onUpdate(row.studentId, "exam", v)}
        />

        <div className="text-center">
          <span
            className={cn(
              "text-sm font-bold",
              row.total >= 50 ? "text-emerald-300" : "text-red-400",
            )}
          >
            {row.total.toFixed(1)}
          </span>
        </div>

        <div className="text-center">
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0 border font-semibold",
              gradeColor(row.grade),
            )}
          >
            {row.grade}
          </Badge>
        </div>

        <div className="text-center">
          <span className="text-[10px] text-emerald-600">{row.remark}</span>
        </div>

        <div className="text-center">
          <Tooltip>
            <TooltipTrigger>
              <span className="text-xs text-emerald-500 font-semibold">
                {ordinal(position)}
              </span>
            </TooltipTrigger>
            <TooltipContent className="bg-[#0a1f14] border-emerald-900 text-emerald-300 text-xs">
              Position based on current scores
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-900/60 border border-emerald-800/50 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{row.name}</p>
              <p className="text-[10px] text-emerald-700">{row.admissionNo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                "text-[10px] px-1.5 py-0 border font-semibold",
                gradeColor(row.grade),
              )}
            >
              {row.grade}
            </Badge>
            <span
              className={cn(
                "text-sm font-bold",
                row.total >= 50 ? "text-emerald-300" : "text-red-400",
              )}
            >
              {row.total.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5 text-[10px] text-emerald-700">
          {MOBILE_COLS.map((col) => (
            <div key={col.field} className="space-y-1">
              <p className="text-center">{col.label}</p>
              <ScoreSelect
                value={row[col.field]}
                options={col.opts}
                onChange={(v) => onUpdate(row.studentId, col.field, v)}
                compact
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
