import { db } from "@/lib/prisma";
import { AddClassButton } from "./_components/add-class-button";
import { ClassList } from "./_components/class-list";

export default async function AdminClassesPage() {
  const classes = await db.class.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Responsive Header: Stacks on mobile, Row on tablet+ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 md:px-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight md:text-3xl text-text-primary">
            Manage Classes
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            Organize academic levels and student groupings.
          </p>
        </div>

        {/* Button is full-width on mobile */}
        <div className="w-full sm:w-auto">
          <AddClassButton />
        </div>
      </div>

      {/* Container: No border on mobile to save space, rounded on desktop */}
      <div className="bg-bg-surface md:border md:rounded-sm overflow-hidden">
        <ClassList initialClasses={classes} />
      </div>
    </div>
  );
}
