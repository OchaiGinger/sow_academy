import { StatsCard } from "@/components/shared/stats-card";
import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PageHeader } from "@/components/shared/page-header";

export default async function FormMasterDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const formMaster = await db.formMaster.findFirst({
    where: { teacher: { userId: session?.user.id } },
    include: { class: { include: { students: true } } },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Form Master Dashboard"
        description={`Managing ${formMaster?.class.name || "Assigned Class"}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          label="Class Strength"
          value={formMaster?.class.students.length || 0}
          accent
        />
        <StatsCard label="Result Completion" value="0%" />
        <StatsCard label="Assessments Done" value="0/0" />
      </div>

      {!formMaster && (
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
