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
        classSubjects: { select: { id: true } },
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

  // The "Add" form should only offer unallocated subjects; the edit form
  // separately re-includes the ones already held by that teacher.
  const unallocatedSubjects = availableSubjects.filter(
    (cs) => cs.teacherId === null,
  );

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
        <AddTeacherButton availableSubjects={unallocatedSubjects} />
      </div>

      <div className="border border-border-subtle rounded-sm bg-bg-surface overflow-hidden shadow-sm">
        {/* Now initialData matches the TeacherItem interface exactly */}
        <TeacherList
          initialData={teachers}
          allSubjects={availableSubjects}
        />
      </div>
    </div>
  );
}
