"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { WorkspaceModal } from "@/components/ui/workspace-modal";
import ResultSheetPreview from "./result-sheet-preview";
import { ScoreEntrySheet } from "./score-entry-sheet";
import { withTotals } from "@/utils/score-utils";

import type { getStudentsWithScores } from "@/app/actions/score-actions";

type FullPageData = NonNullable<
  Awaited<ReturnType<typeof getStudentsWithScores>>
>;

type Student = FullPageData["students"][number];

interface Props {
  classSubject: FullPageData["classSubject"];
  currentTerm: FullPageData["currentTerm"];
  students: FullPageData["students"];
  classSubjectId: string;
  termId: string;
  openWindows: Set<string>;
}

export function ScorePageClient({
  classSubject,
  currentTerm,
  students: serverStudents,
  classSubjectId,
  termId,
  openWindows,
}: Props) {
  const router = useRouter();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [students, setStudents] = useState(serverStudents);

  useEffect(() => {
    setStudents(serverStudents);
  }, [serverStudents]);

  const refreshData = useCallback(async () => {
    await router.refresh();
  }, [router]);

  const rows = withTotals(
    students.map((s) => {
      const sc = s.scores[0];
      return {
        studentId: s.id,
        name: s.user.name,
        admissionNo: s.admissionNo,
        assignment1: sc?.assignment1 ?? 0,
        assignment2: sc?.assignment2 ?? 0,
        test1: sc?.test1 ?? 0,
        test2: sc?.test2 ?? 0,
        exam: sc?.exam ?? 0,
        dirty: false,
      };
    }),
  );

  const handleSaved = useCallback(async () => {
    setSheetOpen(false);
    await refreshData();
  }, [refreshData]);

  function openSheet(student: Student) {
    setSelectedStudent(student);
    setSheetOpen(true);
  }

  const termLabel = currentTerm.name
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <>
      <div className="min-h-full space-y-4 rounded-xl border-2 border-black bg-white p-3 text-black sm:p-6">
        <div className="flex flex-col gap-4 rounded-xl border-2 border-black bg-black p-4 text-white sm:flex-row sm:items-center sm:p-5">
          <Link
            href="/teacher/scores"
            className="inline-flex min-h-11 w-fit shrink-0 items-center gap-2 rounded-lg border-2 border-white px-4 py-2 text-sm font-black text-white transition-colors hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to subjects
          </Link>
          <div className="min-w-0 sm:border-l-2 sm:border-white/40 sm:pl-5">
            <h2 className="break-words text-2xl font-black leading-tight text-white sm:text-3xl">
              {classSubject.subject.name}
            </h2>
            <p className="mt-1 text-sm font-bold text-white sm:text-base">
              {classSubject.class.name} <span aria-hidden="true">·</span> {termLabel} Term <span aria-hidden="true">·</span> {currentTerm.session.name}
            </p>
          </div>
        </div>

        {openWindows.size === 0 && (
          <div className="rounded-lg border-2 border-black bg-gray-100 px-4 py-3 text-sm font-bold text-black">
            ⚠️ No score entry windows are currently open. Contact your admin.
          </div>
        )}

        <ResultSheetPreview
          rows={rows}
          onStudentClick={openSheet}
          students={students}
        />
      </div>

      <WorkspaceModal
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Enter student scores"
        description={selectedStudent
          ? `${selectedStudent.user.name} · ${classSubject.class.name} · ${classSubject.subject.name}`
          : "Enter assessment scores for this student."}
        size="medium"
        tone="light"
      >
        {selectedStudent && (
          <ScoreEntrySheet
            student={selectedStudent}
            classSubjectId={classSubjectId}
            termId={termId}
            openWindows={openWindows}
            onSaved={handleSaved}
          />
        )}
      </WorkspaceModal>
    </>
  );
}
