import { StatsCard } from "@/components/shared/stats-card";
import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PageHeader } from "@/components/shared/page-header";

export default async function FormMasterDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const formMasters = await db.formMaster.findMany({
    where: { teacher: { userId: session?.user.id } },
    include: { class: { include: { _count: { select: { students: true } } } } },
    orderBy: { class: { name: "asc" } },
  });
  const totalStudents = formMasters.reduce(
    (total, assignment) => total + assignment.class._count.students,
    0,
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Form Master Dashboard"
        description={`Managing ${formMasters.length} ${formMasters.length === 1 ? "class" : "classes"}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          label="Assigned Classes"
          value={formMasters.length}
          accent
        />
        <StatsCard label="Students Across Classes" value={totalStudents} />
        <StatsCard label="Result Completion" value="0%" />
      </div>

      {formMasters.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Your Classes</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {formMasters.map(({ id, class: assignedClass }) => (
              <div key={id} className="rounded-lg border bg-bg-surface p-4">
                <p className="font-semibold">{assignedClass.name}</p>
                <p className="mt-1 text-sm text-text-secondary">
                  {assignedClass._count.students} students
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {formMasters.length === 0 && (
        <div className="bg-bg-surface border border-danger/20 p-8 rounded-sm text-center">
          <p className="text-danger font-bold text-sm">
            System Alert: No class assignment found for your profile.
          </p>
          <p className="text-text-secondary text-xs mt-1">
            Please contact the administrator to assign you as a form master for
            a specific class.
          </p>
        </div>
      )}
    </div>
  );
}
