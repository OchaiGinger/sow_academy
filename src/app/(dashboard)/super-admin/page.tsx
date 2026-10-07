import { db } from "@/lib/prisma";
import { getSchools } from "@/app/actions/school-actions";
import { SchoolsClient } from "./_components/schools-client";

export default async function SuperAdminSchoolsPage() {
  const result = await getSchools();
  const schools = result.success ? (result.schools ?? []) : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Schools Management
          </h1>
          <p className="text-text-tertiary italic text-sm">
            Manage all schools on the platform. Create, edit, or remove schools.
          </p>
        </div>
        <div className="text-xs text-text-tertiary">
          Total: <span className="font-bold text-text-primary">{schools.length}</span> schools
        </div>
      </div>

      <SchoolsClient initialSchools={schools} />
    </div>
  );
}
