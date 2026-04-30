import { db } from "@/lib/prisma";
import { AddSubjectButton } from "./_components/add-subject-button";
import { SubjectList } from "./_components/subject-list";

export default async function AdminSubjectsPage() {
  const classes = await db.class.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const subjects = await db.subject.findMany({
    orderBy: { name: "asc" },
    include: {
      classSubjects: {
        select: { classId: true },
      },
    },
  });

  return (
    // overflow-x-hidden on the parent is mandatory to kill stray scrolls
    <div className="max-w-6xl mx-auto py-4 px-4 md:py-8 md:px-6 space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b pb-6">
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight md:text-4xl text-foreground">
            Subjects
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your school curriculum and class assignments.
          </p>
        </div>
        <div className="w-full sm:w-auto shrink-0">
          <AddSubjectButton classes={classes} />
        </div>
      </div>

      <div className="w-full animate-in fade-in slide-in-from-bottom-3 duration-500">
        <SubjectList initialSubjects={subjects} classes={classes} />
      </div>
    </div>
  );
}
