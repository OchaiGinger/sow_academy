"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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

  return (
    <>
      <div className="space-y-4 p-3 sm:p-6">
        <div>
          <h2 className="text-2xl font-black text-black sm:text-3xl">
            {classSubject.subject.name}
          </h2>
          <p className="mt-1 text-sm font-bold text-black sm:text-base">
            {classSubject.class.name} · {" "}
            {currentTerm.name.charAt(0) +
              currentTerm.name.slice(1).toLowerCase()}
            Term · {currentTerm.session.name}
          </p>
        </div>

        {openWindows.size === 0 && (
          <div className="rounded-lg border-2 border-black bg-gray-100 px-4 py-3 text-sm font-bold text-black">
            ⚠️ No score entry windows are currently open. Contact your admin.
          </div>
        )}

        <ResultSheetPreview
          classSubject={classSubject}
          currentTerm={currentTerm}
          rows={rows}
          onStudentClick={openSheet}
          students={students}
        />
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="h-dvh w-screen max-w-none overflow-hidden border-l-2 border-black bg-white p-0 text-black sm:max-w-lg"
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
        </SheetContent>
      </Sheet>
    </>
  );
}
