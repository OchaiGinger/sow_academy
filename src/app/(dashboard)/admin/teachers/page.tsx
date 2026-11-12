import { db } from "@/lib/prisma";
import { TeacherList } from "./_components/teacher-list";
import { AddTeacherButton } from "./_components/add-teacher-button";

export default async function AdminTeachersPage() {
  const [teachers, availableSubjects] = await Promise.all([
    db.teacher.findMany({
      select: {
        id: true,
        userId: true,
        staffId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            role: true,
          },
        },
        _count: { select: { classSubjects: true } },
        classSubjects: { select: { id: true, class: { select: { name: true } }, subject: { select: { name: true } } } },
        formMasters: { select: { class: { select: { name: true } } } },
      },
      orderBy: { user: { name: "asc" } },
    }),
    db.classSubject.findMany({
      select: {
        id: true,
        teacherId: true,
        class: { select: { name: true } },
        subject: { select: { name: true } },
      },
      orderBy: [{ class: { name: "asc" } }, { subject: { name: "asc" } }],
    }),
  ]);

  // The "Add" form should only offer unallocated subjects. The edit form
  // needs all offerings so it can show the teacher's current assignments too.
  const unallocatedSubjects = availableSubjects.filter(
    (cs) => cs.teacherId === null,
  );

  return (
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Teachers
          </h1>
          <p className="text-text-tertiary italic text-sm">
            Manage school staff accounts and subject allocations.
          </p>
        </div>
        <div className="w-full shrink-0 sm:w-auto">
          <AddTeacherButton availableSubjects={unallocatedSubjects} />
        </div>
      </div>

      <div className="border border-border-subtle rounded-sm bg-bg-surface overflow-hidden shadow-sm">
        <TeacherList
          initialData={teachers}
          availableSubjects={availableSubjects}
        />
      </div>
    </div>
  );
}
