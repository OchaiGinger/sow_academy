"use client";

import { useRouter } from "next/navigation"; // ADD
import { useState } from "react";
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
  students,
  classSubjectId,
  termId,
  openWindows,
}: Props) {
  const router = useRouter(); // ADD
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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
  function openSheet(student: Student) {
    setSelectedStudent(student);
    setSheetOpen(true);
  }

  return (
    <>
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            {classSubject.subject.name}
          </h2>
          <p className="text-sm text-emerald-700">
            {classSubject.class.name} ·
            {currentTerm.name.charAt(0) +
              currentTerm.name.slice(1).toLowerCase()}
            Term · {currentTerm.session.name}
          </p>
        </div>

        {openWindows.size === 0 && (
          <div className="rounded-lg border border-yellow-900/40 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-400">
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
          className="w-full sm:max-w-md bg-[#050c0a] border-emerald-900/40 p-0 overflow-y-auto"
        >
          {selectedStudent && (
            <ScoreEntrySheet
              student={selectedStudent}
              classSubjectId={classSubjectId}
              termId={termId}
              openWindows={openWindows}
              onSaved={() => {
                // CHANGE
                setSheetOpen(false);
                router.refresh(); // re-fetches server data instantly
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
