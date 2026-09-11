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
          _count: { select: { scores: true } },
        },
        orderBy: { class: { name: "asc" } },
      },
    },
  });

  if (!teacher || teacher.classSubjects.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-yellow-900/40 bg-yellow-950/20 px-4 py-3 text-sm text-yellow-400">
          No subjects assigned to you yet. Contact your admin.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Enter Scores</h1>
        <p className="text-sm text-emerald-700">
          Select a subject-class below to enter scores
        </p>
      </div>

      <div className="grid gap-3">
        {teacher.classSubjects.map((cs) => (
          <Link
            key={cs.id}
            href={`/teacher/scores/${cs.id}`}
            className="flex items-center justify-between rounded-lg border border-emerald-900/40 bg-[#0a1f14] p-4 hover:bg-[#0a1f14]/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-900/30">
                <BookOpen className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {cs.subject.name}
                </p>
                <p className="text-xs text-emerald-700">{cs.class.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-700">
                {cs._count.scores} scores
              </span>
              <ArrowRight className="h-4 w-4 text-emerald-800" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
