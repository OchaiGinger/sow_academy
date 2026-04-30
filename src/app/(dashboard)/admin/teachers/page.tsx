import { db } from "@/lib/prisma";
import { TeacherList } from "./_components/teacher-list";
import { AddTeacherButton } from "./_components/add-teacher-button";

export default async function AdminTeachersPage() {
  const [teachers, availableSubjects] = await Promise.all([
    db.teacher.findMany({
      select: {
        id: true, // Teacher Record ID
        userId: true, // Link to User
        staffId: true,
        user: {
          select: {
            id: true, // CRITICAL: User ID for the action
            name: true,
            email: true,
            phone: true,
            image: true,
            role: true, // CRITICAL: Needed to check PRINCIPAL status
          },
        },
        _count: { select: { classSubjects: true } },
      },
      orderBy: { user: { name: "asc" } },
    }),
    db.classSubject.findMany({
      where: { teacherId: null },
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Teachers
          </h1>
          <p className="text-text-tertiary italic text-sm">
            Manage school staff accounts and subject allocations.
          </p>
        </div>
        <AddTeacherButton availableSubjects={availableSubjects} />
      </div>

      <div className="border border-border-subtle rounded-sm bg-bg-surface overflow-hidden shadow-sm">
        {/* Now initialData matches the TeacherItem interface exactly */}
        <TeacherList initialData={teachers as any} />
      </div>
    </div>
  );
}
