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

type ScoreField = "assignment1" | "assignment2" | "test1" | "test2" | "test3" | "exam";

interface ScoreTableRowProps {
  row: ScoreRowWithTotals;
  index: number;
  position: number;
  isSaved: boolean;
  onUpdate: (studentId: string, field: ScoreField, value: number) => void;
}

const MOBILE_COLS: { label: string; field: ScoreField; opts: string[] }[] = [
  { label: "Assignment 1 · /5", field: "assignment1", opts: ASSIGNMENT_OPTS },
  { label: "Assignment 2 · /5", field: "assignment2", opts: ASSIGNMENT_OPTS },
  { label: "Test 1 · /10", field: "test1", opts: TEST_OPTS },
  { label: "Test 2 · /10", field: "test2", opts: TEST_OPTS },
  { label: "Test 3 · /10", field: "test3", opts: TEST_OPTS },
  { label: "Exam · /60", field: "exam", opts: EXAM_OPTS },
];

export function ScoreTableRow({
  row,
  index,
  position,
  isSaved,
  onUpdate,
}: ScoreTableRowProps) {
  const rowState = row.dirty
    ? "border-l-4 border-black"
    : isSaved
      ? "border-l-4 border-gray-500"
      : "border-l-4 border-transparent";

  return (
    <div className={cn("bg-white px-3 py-4 text-black transition-colors sm:px-4", rowState)}>
      {/* Desktop */}
      <div className="hidden items-center gap-x-1 md:grid md:grid-cols-[2rem_minmax(0,1fr)_repeat(6,5rem)_5rem_5rem_4.5rem_3rem]">
        <span className="text-sm font-bold text-black">{index + 1}</span>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-full border border-gray-300 bg-gray-100 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-black" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-black truncate leading-tight">
              {row.name}
            </p>
            <p className="text-xs font-semibold text-gray-700">{row.admissionNo}</p>
          </div>
          {isSaved && (
            <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
          )}
          {row.dirty && (
            <AlertCircle className="w-4 h-4 text-black shrink-0" />
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
          value={row.test3}
          options={TEST_OPTS}
          onChange={(v) => onUpdate(row.studentId, "test3", v)}
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
              row.total >= 50 ? "text-black" : "text-black",
            )}
          >
            {row.total.toFixed(1)}
          </span>
        </div>

        <div className="text-center">
          <Badge
            className={cn(
              gradeColor(row.grade),
              "border-black bg-white px-1.5 py-0 text-[10px] font-black text-black",
            )}
          >
            {row.grade}
          </Badge>
        </div>

        <div className="text-center">
          <span className="text-xs font-bold text-black">{row.remark}</span>
        </div>

        <div className="text-center">
          <Tooltip>
            <TooltipTrigger>
              <span className="text-sm text-black font-bold">
                {ordinal(position)}
              </span>
            </TooltipTrigger>
            <TooltipContent className="border-2 border-black bg-white text-xs font-bold text-black">
              Position based on current scores
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full border border-gray-300 bg-gray-100 flex items-center justify-center">
              <User className="w-5 h-5 text-black" />
            </div>
            <div>
              <p className="text-base font-black text-black">{row.name}</p>
              <p className="text-xs font-semibold text-gray-700">{row.admissionNo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                gradeColor(row.grade),
                "border-black bg-white px-1.5 py-0 text-[10px] font-black text-black",
              )}
            >
              {row.grade}
            </Badge>
            <span
              className={cn(
                "text-sm font-bold",
                "text-black",
              )}
            >
              {row.total.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 text-sm font-bold text-black sm:grid-cols-3">
          {MOBILE_COLS.map((col) => (
            <div key={col.field} className="min-w-0 space-y-1.5">
              <p className="text-xs font-black text-black sm:text-sm">{col.label}</p>
              <ScoreSelect
                value={row[col.field]}
                options={col.opts}
                onChange={(v) => onUpdate(row.studentId, col.field, v)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
