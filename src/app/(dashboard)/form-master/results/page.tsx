// app/(dashboard)/form-master/results/page.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getFormMasterClassData } from "@/app/actions/form-master-actions";
import { ClassResultTable } from "./_components/class-result-table";
import { GraduationCap } from "lucide-react";

export default async function FormMasterResultsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const data = await getFormMasterClassData(session.user.id);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] p-6 text-center border border-dashed border-emerald-900/30 rounded-xl mx-4">
        <GraduationCap className="w-10 h-10 text-emerald-800 mb-3" />
        <h2 className="text-white font-bold text-lg">No Class Assigned</h2>
        <p className="text-sm text-emerald-700 mt-1 max-w-xs">
          No class assignment found for your account. Contact the administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 md:px-0">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Form Master Desk
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            <span className="text-xs text-emerald-600">
              Class:{" "}
              <span className="text-emerald-400 font-semibold">
                {data.className}
              </span>
            </span>
            <span className="text-emerald-900">·</span>
            <span className="text-xs text-emerald-600">
              Term:{" "}
              <span className="text-emerald-400 font-semibold">
                {data.termName}
              </span>
            </span>
            <span className="text-emerald-900">·</span>
            <span className="text-xs text-emerald-600">
              Students:{" "}
              <span className="text-emerald-400 font-semibold">
                {data.results.length}
              </span>
            </span>
            <span className="text-emerald-900">·</span>
            <span className="text-xs text-emerald-600">
              Subjects:{" "}
              <span className="text-emerald-400 font-semibold">
                {data.classSubjects.length}
              </span>
            </span>
          </div>
        </div>

        {/* Quick stats pill */}
        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-900/30 rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">
              {data.results.filter((r: any) => r.isApproved).length}/
              {data.results.length} Signed
            </span>
          </div>
        </div>
      </div>

      <ClassResultTable
        initialData={data.results}
        school={data.school}
        termName={data.termName}
        termId={data.termId}
        allSubjects={data.classSubjects}
        results={data.results}
      />
    </div>
  );
}
