// app/(dashboard)/form-master/results/_components/class-result-table.tsx
"use client";

import { useMemo, useState } from "react";
import { ReportCardModal } from "@/components/report-card/reportCardModel";
import { FileText, TrendingUp, TrendingDown, Medal, Search, Users, ClipboardCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ClassSubject } from "@/components/report-card/academic-record";
import type {
  ReportSchool,
  ReportStudent,
} from "@/components/report-card/report-card-types";

interface Props {
  initialData: ReportStudent[];
  school: ReportSchool | null;
  termName: string;
  termId: string;
  allSubjects: ClassSubject[];
  subjectsByStudent?: Record<string, ClassSubject[]>;
  userRole?: string;
  results?: ReportStudent[];
}

export function ClassResultTable({
  initialData,
  school,
  termName,
  termId,
  allSubjects,
  subjectsByStudent,
  userRole,
}: Props) {
  const [selectedStudent, setSelectedStudent] = useState<ReportStudent | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [query, setQuery] = useState("");

  const handleOpenSheet = (student: ReportStudent) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const filteredStudents = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return initialData;
    return initialData.filter((student) =>
      `${student.name} ${student.admissionNo ?? ""}`.toLowerCase().includes(search),
    );
  }, [initialData, query]);

  const signedCount = initialData.filter((student) => student.isApproved).length;
  const completeCount = initialData.filter((student) => {
    const eligibleSubjects = subjectsByStudent?.[student.studentId] ?? allSubjects;
    const scoredNames = new Set(student.subjects.map((subject) => subject.name.trim().toLowerCase()));
    return eligibleSubjects.length > 0 && eligibleSubjects.every((subject) => scoredNames.has(subject.name.trim().toLowerCase()));
  }).length;
  const modalStudent = selectedStudent
    ? initialData.find((student) => student.studentId === selectedStudent.studentId) ?? selectedStudent
    : null;

  return (
    <>
      <section className="space-y-4 rounded-2xl border-2 border-black bg-white p-3 text-black shadow-sm sm:p-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <div className="rounded-xl border-2 border-black bg-white p-3 sm:p-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-black"><Users className="h-4 w-4" />Students</div>
            <p className="mt-1 text-2xl font-black text-black">{initialData.length}</p>
          </div>
          <div className="rounded-xl border-2 border-black bg-white p-3 sm:p-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-black"><ClipboardCheck className="h-4 w-4" />Scores complete</div>
            <p className="mt-1 text-2xl font-black text-black">{completeCount}<span className="ml-1 text-sm font-bold">/ {initialData.length}</span></p>
          </div>
          <div className="col-span-2 rounded-xl border-2 border-black bg-white p-3 sm:col-span-1 sm:p-4">
            <div className="text-xs font-black uppercase tracking-wide text-black">Reports signed</div>
            <p className="mt-1 text-2xl font-black text-black">{signedCount}<span className="ml-1 text-sm font-bold">/ {initialData.length}</span></p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-700" aria-hidden="true" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search student name or admission number"
            aria-label="Search students"
            className="h-12 border-2 border-black bg-white pl-10 text-base font-semibold text-black placeholder:text-gray-600 focus-visible:ring-black"
          />
        </div>

        <div className="grid items-start gap-3 xl:grid-cols-2">
        {filteredStudents.map((row) => {
          const eligibleSubjects = subjectsByStudent?.[row.studentId] ?? allSubjects;
          const scoredNames = new Set(
            row.subjects.map((subject) => subject.name.trim().toLowerCase()),
          );
          const missingSubjects = eligibleSubjects.filter(
            (subject) => !scoredNames.has(subject.name.trim().toLowerCase()),
          ).length;

          return (
          <article
            key={row.studentId}
            className="min-w-0 rounded-2xl border-2 border-black bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex items-start gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-black bg-gray-100 sm:h-16 sm:w-16">
                {row.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.photo} alt={`${row.name} profile`} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-black text-black">{row.name.trim().charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-base font-black leading-tight text-black sm:text-lg">{row.name}</h2>
                <p className="mt-1 truncate font-mono text-xs font-bold text-gray-700">{row.admissionNo || "No admission number"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full border border-black bg-white px-2.5 py-1 text-xs font-black text-black`}>
                    <Medal className="h-3.5 w-3.5" /> Rank #{row.rank}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-black bg-white px-2.5 py-1 text-xs font-black text-black">
                    {row.average >= 50 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {row.average.toFixed(1)}%
                  </span>
                  <span className="rounded-full border border-black bg-white px-2.5 py-1 text-xs font-black text-black">
                    {row.isApproved ? "Report signed" : "Needs review"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t-2 border-gray-200 pt-3">
              <div>
                {eligibleSubjects.length > 0 && (missingSubjects > 0 ? (
                  <span className="rounded-full border-2 border-black bg-gray-100 px-3 py-1.5 text-xs font-black text-black">{missingSubjects} subject{missingSubjects !== 1 ? "s" : ""} missing</span>
                ) : (
                  <span className="rounded-full border-2 border-black bg-white px-3 py-1.5 text-xs font-black text-black">All scores complete</span>
                ))}
              </div>
              <Button
                onClick={() => handleOpenSheet(row)}
                className="min-h-11 w-full gap-2 border-2 border-black bg-black font-black text-white hover:bg-gray-800 sm:w-auto"
                aria-label={`Open report for ${row.name}`}
              >
                <FileText className="h-4 w-4" /> Review student report
              </Button>
            </div>
          </article>
          );
        })}
        {filteredStudents.length === 0 && (
          <div className="col-span-full rounded-xl border-2 border-dashed border-black p-8 text-center text-sm font-bold text-black">
            {initialData.length ? "No students match your search." : "No students are assigned to this class."}
          </div>
        )}
        </div>
      </section>

      <ReportCardModal
        student={modalStudent}
        school={school}
        termName={termName}
        termId={termId}
        isOpen={isModalOpen}
        userRole={userRole}
        allSubjects={modalStudent
          ? subjectsByStudent?.[modalStudent.studentId] ?? allSubjects
          : allSubjects}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
