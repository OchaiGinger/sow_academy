import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

export default async function TeacherScoresPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      classSubjects: {
        include: {
          class: true,
          subject: true,
          _count: { select: { scores: true, studentEnrollments: true } },
        },
        orderBy: { class: { name: "asc" } },
      },
    },
  });

  if (!teacher || teacher.classSubjects.length === 0) {
    return (
      <div className="rounded-xl border-2 border-black bg-white p-3 text-black sm:p-6">
        <div className="rounded-lg border-2 border-black bg-gray-100 px-4 py-3 text-sm font-bold text-black">
          No subjects assigned to you yet. Contact your admin.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-xl border-2 border-black bg-white p-3 text-black sm:p-6">
      <div>
        <h1 className="text-2xl font-black text-black sm:text-3xl">Enter Scores</h1>
        <p className="mt-1 text-sm font-bold text-black sm:text-base">
          Select a subject-class below to enter scores
        </p>
      </div>

      <div className="grid gap-3">
        {teacher.classSubjects.map((cs) => (
          <Link
            key={cs.id}
            href={`/teacher/scores/${cs.id}`}
            className="flex items-center justify-between gap-3 rounded-xl border-2 border-black bg-white p-4 text-black shadow-sm transition-colors hover:bg-gray-100 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-black bg-gray-100">
                <BookOpen className="h-5 w-5 text-black" />
              </div>
              <div>
                <p className="text-base font-black text-black sm:text-lg">
                  {cs.subject.name}
                </p>
                <p className="text-sm font-bold text-black">
                  {cs.class.name}
                  {cs.isElective ? ` · Elective · ${cs._count.studentEnrollments} enrolled` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-sm font-bold text-black sm:inline">
                {cs._count.scores} scores
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-black" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
