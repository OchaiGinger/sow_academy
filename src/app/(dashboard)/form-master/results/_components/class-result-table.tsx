// app/(dashboard)/form-master/results/_components/class-result-table.tsx
"use client";

import { useState } from "react";
import { ReportCardModal } from "@/components/report-card/reportCardModel";
import { FileText, TrendingUp, TrendingDown, Medal } from "lucide-react";
import type { ClassSubject } from "@/components/report-card/academic-record";

interface Props {
  initialData: any[];
  school: any;
  termName: string;
  termId: string;
  allSubjects: ClassSubject[];
  userRole?: string;
  results?: any[];
}

export function ClassResultTable({
  initialData,
  school,
  termName,
  termId,
  allSubjects,
  userRole,
}: Props) {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenSheet = (student: any) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1)
      return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
    if (rank === 2) return "text-slate-300 bg-slate-300/10 border-slate-300/30";
    if (rank === 3)
      return "text-orange-400 bg-orange-400/10 border-orange-400/30";
    return "text-emerald-600 bg-emerald-900/20 border-emerald-900/30";
  };

  return (
    <>
      {/* ── MOBILE: Card List ── */}
      <div className="md:hidden space-y-2 p-3">
        {initialData.map((row: any) => (
          <div
            key={row.studentId}
            className="flex items-center gap-3 rounded-xl border border-emerald-900/20 bg-black/20 px-3 py-3"
          >
            {/* Rank badge */}
            <span
              className={`shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center text-xs font-black ${getRankStyle(row.rank)}`}
            >
              #{row.rank}
            </span>

            {/* Name + average */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate leading-tight">
                {row.name}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {row.average >= 50 ? (
                  <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-400 shrink-0" />
                )}
                <span
                  className={`text-xs font-bold ${
                    row.average >= 50 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {row.average.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Subjects completion indicator */}
            {allSubjects.length > 0 &&
              (() => {
                const scoredNames = new Set(
                  row.subjects.map((s: any) => s.name.trim().toLowerCase()),
                );
                const missing = allSubjects.filter(
                  (cs) => !scoredNames.has(cs.name.trim().toLowerCase()),
                ).length;
                return missing > 0 ? (
                  <span className="shrink-0 text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-lg px-1.5 py-0.5">
                    {missing} missing
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 rounded-lg px-1.5 py-0.5">
                    ✓ Complete
                  </span>
                );
              })()}

            {/* Action icon */}
            <button
              onClick={() => handleOpenSheet(row)}
              className="shrink-0 w-9 h-9 rounded-lg border border-emerald-900/30 bg-emerald-950/40 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-colors active:scale-95"
              aria-label={`Open report for ${row.name}`}
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ── DESKTOP: Table ── */}
      <div className="hidden md:block rounded-xl border border-emerald-900/20 bg-black/20 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-emerald-950/30">
            <tr className="border-b border-emerald-900/20">
              <th className="text-left text-emerald-500 font-bold px-5 py-3 w-20">
                Rank
              </th>
              <th className="text-left text-emerald-500 font-bold px-4 py-3">
                Student Name
              </th>
              <th className="text-center text-emerald-500 font-bold px-4 py-3 w-32">
                Average
              </th>
              <th className="text-center text-emerald-500 font-bold px-4 py-3 w-36">
                Scores
              </th>
              <th className="text-right text-emerald-500 font-bold px-5 py-3 w-16" />
            </tr>
          </thead>
          <tbody>
            {initialData.map((row: any) => {
              const scoredNames = new Set(
                row.subjects.map((s: any) => s.name.trim().toLowerCase()),
              );
              const missingCount =
                allSubjects.length > 0
                  ? allSubjects.filter(
                      (cs) => !scoredNames.has(cs.name.trim().toLowerCase()),
                    ).length
                  : 0;

              return (
                <tr
                  key={row.studentId}
                  className="border-b border-emerald-900/10 hover:bg-emerald-500/5 transition-colors last:border-0"
                >
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-black ${getRankStyle(row.rank)}`}
                    >
                      {row.rank <= 3 && <Medal className="w-3 h-3" />}#
                      {row.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white font-medium">
                    {row.name}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold ${
                        row.average >= 50 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {row.average >= 50 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {row.average.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {missingCount > 0 ? (
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-2 py-0.5">
                        {missingCount} subject{missingCount !== 1 ? "s" : ""}{" "}
                        missing
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-2 py-0.5">
                        ✓ All scores entered
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleOpenSheet(row)}
                      className="w-8 h-8 rounded-lg border border-emerald-900/30 bg-emerald-950/40 inline-flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-colors"
                      aria-label={`Open report for ${row.name}`}
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ReportCardModal
        student={selectedStudent}
        school={school}
        termName={termName}
        termId={termId}
        isOpen={isModalOpen}
        userRole={userRole}
        allSubjects={allSubjects}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
