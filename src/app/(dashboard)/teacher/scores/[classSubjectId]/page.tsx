import { getStudentsWithScores } from "@/app/actions/score-actions";
import { getOpenWindowsForCurrentTerm } from "@/app/actions/score-window-actions";
import { ScorePageClient } from "./_components/score-page-client";
import { notFound } from "next/navigation";

export default async function ScoreEntryPage({
  params,
}: {
  params: Promise<{ classSubjectId: string }>;
}) {
  const { classSubjectId } = await params;

  const [data, openWindows] = await Promise.all([
    getStudentsWithScores(classSubjectId),
    getOpenWindowsForCurrentTerm(),
  ]);

  if (!data) return notFound();

  const openSet = new Set(openWindows.map((w) => w.component));

  return (
    <ScorePageClient
      classSubject={data.classSubject}
      currentTerm={data.currentTerm}
      students={data.students}
      classSubjectId={classSubjectId}
      termId={data.currentTerm.id}
      openWindows={openSet}
    />
  );
}
