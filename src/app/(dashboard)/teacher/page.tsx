import { StatsCard } from "@/components/shared/stats-card";
import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function TeacherDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  // 1. Fetch Teacher with assigned subjects and the students in those classes
  const teacher = await db.teacher.findUnique({
    where: { userId: session?.user.id },
    include: {
      classSubjects: {
        include: {
          class: {
            include: {
              _count: { select: { students: true } },
              students: { select: { id: true } },
            },
          },
          subject: true,
          _count: { select: { scores: true } },
        },
      },
    },
  });

  // 2. Calculate Unique Students
  // We use a Set to ensure we don't double-count a student if they are in multiple classes assigned to you
  const studentIds = new Set();
  teacher?.classSubjects.forEach((cs) => {
    cs.class.students.forEach((s) => studentIds.add(s.id));
  });
  const totalStudents = studentIds.size;

  // 3. Calculate Score Entry Progress
  // This logic assumes every student in a class needs a score for that class-subject
  let totalPotentialScores = 0;
  let actualScoresEntered = 0;

  teacher?.classSubjects.forEach((cs) => {
    totalPotentialScores += cs.class._count.students;
    actualScoresEntered += cs._count.scores;
  });

  const completionRate =
    totalPotentialScores > 0
      ? Math.round((actualScoresEntered / totalPotentialScores) * 100)
      : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title={`Welcome back, ${session?.user.name}`}
        description="Manage your classroom scores and student academic tracking."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          label="Assigned Subject-Classes"
          value={teacher?.classSubjects.length || 0}
          accent
        />
        <StatsCard label="Total Students" value={totalStudents} />
        <StatsCard
          label="Scores Recorded"
          value={`${completionRate}%`}
          trend={completionRate === 100 ? "up" : "neutral"}
        />
      </div>

      <div className="bg-bg-surface border border-border-subtle rounded-sm">
        <div className="p-4 border-b border-border-subtle flex justify-between items-center">
          <h2 className="text-sm font-bold uppercase tracking-wider">
            My Teaching Schedule
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-elevated text-text-secondary text-[10px] uppercase tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Records</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {teacher?.classSubjects.map((cs) => {
                const classStudentCount = cs.class._count.students;
                const scoreCount = cs._count.scores;
                const isComplete =
                  scoreCount >= classStudentCount && classStudentCount > 0;

                return (
                  <tr
                    key={cs.id}
                    className="hover:bg-bg-elevated transition-colors text-text-primary group"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-primary">
                      {cs.class.name}
                    </td>
                    <td className="px-6 py-4 font-bold">{cs.subject.name}</td>
                    <td className="px-6 py-4">
                      {isComplete ? (
                        <span className="text-green-500 text-xs font-bold uppercase">
                          Completed
                        </span>
                      ) : (
                        <span className="text-text-tertiary text-xs">
                          {classStudentCount - scoreCount} Entries Remaining
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/teacher/scores/${cs.id}`}
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-primary transition-colors"
                      >
                        Open Ledger <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {/* Empty state remains the same */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
