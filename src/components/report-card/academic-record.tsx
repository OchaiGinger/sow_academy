// components/report-card/academic-record.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";

export interface ScoredSubject {
  name: string;
  a1: number;
  a2: number;
  t1: number;
  t2: number;
  caTotal: number;
  exam: number;
  total: number;
  grade: string;
}

export interface ClassSubject {
  id: string;
  name: string;
}

interface Props {
  subjects: ScoredSubject[];
  allSubjects?: ClassSubject[];
}

const GRADE_COLOR: Record<string, string> = {
  A: "text-emerald-600",
  B: "text-blue-600",
  C: "text-amber-600",
  D: "text-orange-600",
  E: "text-orange-700",
  F: "text-red-600",
};

export const AcademicRecord = ({ subjects, allSubjects }: Props) => {
  const scoredMap = new Map(
    subjects.map((s) => [s.name.trim().toLowerCase(), s]),
  );

  const rows: Array<{ name: string; scored: ScoredSubject | null }> =
    allSubjects && allSubjects.length > 0
      ? allSubjects.map((cs) => ({
          name: cs.name,
          scored: scoredMap.get(cs.name.trim().toLowerCase()) ?? null,
        }))
      : subjects.map((s) => ({ name: s.name, scored: s }));

  const missingCount = rows.filter((r) => r.scored === null).length;

  return (
    <div className="space-y-0">
      {missingCount > 0 && (
        <div className="flex items-start gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 print:hidden">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 font-semibold">
            {missingCount} subject{missingCount !== 1 ? "s have" : " has"} no
            scores recorded yet — all scores must be entered before signing.
          </p>
        </div>
      )}

      <div className="bg-white overflow-x-auto print:overflow-visible">
        <Table className="min-w-[680px] print:min-w-0 print:w-full print:table-fixed">
          <TableHeader className="bg-slate-50 print:bg-slate-100">
            <TableRow className="border-b border-slate-200">
              {/* Subject column: wider */}
              <TableHead className="font-black uppercase text-[10px] print:text-[6pt] text-slate-900 w-[30%] print:w-[32%] px-2 py-2 print:px-1 print:py-1">
                Subject
              </TableHead>
              {["Asgn 1", "Asgn 2", "Test 1", "Test 2"].map((h) => (
                <TableHead
                  key={h}
                  className="text-center font-bold text-[9px] print:text-[6pt] text-slate-500 px-1 py-2 print:px-0.5 print:py-1"
                >
                  {h}
                </TableHead>
              ))}
              <TableHead className="text-center font-black text-[10px] print:text-[6pt] text-emerald-700 bg-emerald-50/30 px-2 py-2 print:px-1 print:py-1">
                CA
              </TableHead>
              <TableHead className="text-center font-black text-[10px] print:text-[6pt] text-slate-900 px-2 py-2 print:px-1 print:py-1">
                Exam
              </TableHead>
              <TableHead className="text-center font-black text-[10px] print:text-[6pt] bg-slate-900 text-white italic px-2 py-2 print:px-1 print:py-1">
                Total
              </TableHead>
              <TableHead className="text-center font-black text-[10px] print:text-[6pt] text-amber-600 px-2 py-2 print:px-1 print:py-1">
                Grade
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map(({ name, scored }, i) => {
              const missing = scored === null;
              return (
                <TableRow
                  key={i}
                  className={`border-b last:border-0 border-slate-100 transition-colors ${
                    missing
                      ? "bg-amber-50/60 hover:bg-amber-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  {/* Subject name */}
                  <TableCell className="font-black text-[11px] print:text-[6.5pt] py-2 print:py-[1.5px] print:leading-none uppercase text-slate-900 px-2 print:px-1">
                    <div className="flex items-center gap-1">
                      {missing && (
                        <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 print:hidden" />
                      )}
                      <span className="truncate">{name}</span>
                    </div>
                  </TableCell>

                  {/* CA components */}
                  {[scored?.a1, scored?.a2, scored?.t1, scored?.t2].map(
                    (val, idx) => (
                      <TableCell
                        key={idx}
                        className={`text-center text-[11px] print:text-[6.5pt] py-2 print:py-[1.5px] print:leading-none px-1 print:px-0.5 ${
                          missing ? "text-slate-400 italic" : "text-slate-700"
                        }`}
                      >
                        {missing ? "—" : (val ?? 0)}
                      </TableCell>
                    ),
                  )}

                  {/* CA Total */}
                  <TableCell
                    className={`text-center text-[11px] print:text-[6.5pt] print:py-[1.5px] print:leading-none font-black bg-emerald-50/20 px-2 print:px-1 py-2 ${
                      missing ? "text-slate-400 italic" : "text-emerald-700"
                    }`}
                  >
                    {missing ? "—" : (scored?.caTotal ?? 0)}
                  </TableCell>

                  {/* Exam */}
                  <TableCell
                    className={`text-center text-[11px] print:text-[6.5pt] print:py-[1.5px] print:leading-none font-bold px-2 print:px-1 py-2 ${
                      missing ? "text-slate-400 italic" : "text-slate-900"
                    }`}
                  >
                    {missing ? "—" : (scored?.exam ?? 0)}
                  </TableCell>

                  {/* Total */}
                  <TableCell
                    className={`text-center text-xs print:text-[6.5pt] print:py-[1.5px] print:leading-none font-black bg-slate-50 px-2 print:px-1 py-2 ${
                      missing ? "text-slate-400 italic" : "text-slate-900"
                    }`}
                  >
                    {missing ? "—" : (scored?.total ?? 0)}
                  </TableCell>

                  {/* Grade */}
                  <TableCell
                    className={`text-center font-black text-[11px] print:text-[6.5pt] print:py-[1.5px] print:leading-none px-2 print:px-1 py-2 ${
                      missing
                        ? "text-slate-400 italic"
                        : (GRADE_COLOR[scored?.grade ?? "F"] ?? "text-red-600")
                    }`}
                  >
                    {missing ? "—" : scored?.grade || "F"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
