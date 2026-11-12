import { db } from "@/lib/prisma";
import { TeacherIdCardsClient } from "./_components/teacher-id-cards-client";

export default async function AdminTeacherIdCardsPage() {
  const [teachers, school] = await Promise.all([
    db.teacher.findMany({
      select: {
        id: true,
        staffId: true,
        user: { select: { name: true, email: true, phone: true, image: true, role: true } },
        classSubjects: {
          select: { class: { select: { name: true } }, subject: { select: { name: true } } },
        },
      },
      orderBy: { user: { name: "asc" } },
    }),
    db.school.findFirst({ select: { name: true, email: true, logoUrl: true } }),
  ]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Teacher ID Cards</h1>
          <p className="text-sm italic text-text-tertiary">Create and print staff identity cards.</p>
        </div>
        <p className="text-xs text-text-tertiary">
          Total: <span className="font-bold text-text-primary">{teachers.length}</span> teachers
        </p>
      </header>
      <TeacherIdCardsClient
        teachers={teachers}
        school={{
          name: school?.name ?? "SOWA Academy",
          email: school?.email ?? "",
          logoUrl: school?.logoUrl ?? null,
        }}
      />
    </div>
  );
}
