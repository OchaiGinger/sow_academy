// app/(dashboard)/student/result/[termId]/page.tsx
import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { ReportHeader } from "@/components/report-card/header";
import { AcademicRecord } from "@/components/report-card/academic-record";
import { SignatureArea } from "@/components/report-card/signature-area";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { PrintButton } from "../../_components/print-button";

// ─── Grade helpers ────────────────────────────────────────────────────────────

const GRADE_SCALE = [
  { min: 75, grade: "A", remark: "Excellent" },
  { min: 65, grade: "B", remark: "Very Good" },
  { min: 55, grade: "C", remark: "Good" },
  { min: 45, grade: "D", remark: "Fair" },
  { min: 40, grade: "E", remark: "Pass" },
  { min: 0, grade: "F", remark: "Fail" },
] as const;

function resolveGrade(total: number) {
  return GRADE_SCALE.find((g) => total >= g.min) ?? GRADE_SCALE.at(-1)!;
}

function normaliseBehaviour(raw: string | null | undefined): string {
  if (!raw) return "—";
  const n = parseInt(raw, 10);
  if (!isNaN(n)) {
    if (n >= 5) return "Excellent";
    if (n >= 4) return "Very Good";
    if (n >= 3) return "Good";
    if (n >= 2) return "Fair";
    return "Poor";
  }
  return raw;
}

function behaviourColor(label: string) {
  const l = label.toLowerCase();
  if (l.includes("excellent") || l.includes("outstanding"))
    return "text-emerald-600 bg-emerald-50";
  if (l.includes("very good")) return "text-blue-600 bg-blue-50";
  if (l.includes("good")) return "text-sky-600 bg-sky-50";
  if (l.includes("fair")) return "text-amber-600 bg-amber-50";
  if (l.includes("poor")) return "text-red-600 bg-red-50";
  return "text-slate-600 bg-slate-50";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function StudentResultCardPage({
  params,
}: {
  params: Promise<{ termId: string }>; // Params is now a Promise in Next.js 15
}) {
  // 1. Unwrapping params immediately
  const { termId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  // 2. Gate check using the unwrapped termId
  const cookieStore = await cookies();
  if (!cookieStore.get(`result_verified_${termId}`)) {
    redirect("/student");
  }

  // ── Fetch student ──────────────────────────────────────────────────────────
  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: { class: true, user: true },
  });
  if (!student) redirect("/student");

  // ── Parallel fetches using unwrapped termId ────────────────────────────────
  const [term, scores, assessment, termResult, school, formMaster, classSize] =
    await Promise.all([
      db.term.findUnique({
        where: { id: termId },
        include: { session: true },
      }),
      db.score.findMany({
        where: { studentId: student.id, termId: termId },
        include: { classSubject: { include: { subject: true } } },
        orderBy: { classSubject: { subject: { name: "asc" } } },
      }),
      db.assessment.findUnique({
        where: {
          studentId_termId: { studentId: student.id, termId: termId },
        },
      }),
      db.termResult.findUnique({
        where: {
          studentId_termId: { studentId: student.id, termId: termId },
        },
      }),
      db.school.findFirst(),
      db.formMaster.findUnique({
        where: { classId: student.classId },
        include: { teacher: { include: { user: true } } },
      }),
      db.termResult.count({
        where: {
          termId: termId,
          student: { classId: student.classId },
        },
      }),
    ]);

  if (!term) notFound();

  // ── Derived values ─────────────────────────────────────────────────────────
  const computedTotal = scores.reduce(
    (sum, s) =>
      sum +
      (s.total ?? s.assignment1 + s.assignment2 + s.test1 + s.test2 + s.exam),
    0,
  );
  const computedAvg = scores.length > 0 ? computedTotal / scores.length : 0;

  const average = termResult?.average ?? computedAvg;
  const totalScore = termResult?.totalScore ?? computedTotal;
  const rank = termResult?.rank ?? null;

  const nextTermDate =
    (assessment?.nextTermBegins ?? term.nextTermDate)
      ? new Date(
          (assessment?.nextTermBegins ?? term.nextTermDate)!,
        ).toDateString()
      : "To Be Announced";

  const studentForComponents = {
    name: student.user.name,
    average,
    totalScore,
    rank: rank ?? 0,
    totalInClass: classSize,

    subjects: scores.map((s) => {
      const raw =
        s.total ?? s.assignment1 + s.assignment2 + s.test1 + s.test2 + s.exam;
      return {
        name: s.classSubject.subject.name,
        a1: s.assignment1,
        a2: s.assignment2,
        t1: s.test1,
        t2: s.test2,
        caTotal: s.assignment1 + s.assignment2 + s.test1 + s.test2,
        exam: s.exam,
        total: raw,
        grade: s.grade ?? resolveGrade(raw).grade,
      };
    }),

    formMasterName: formMaster?.teacher.user.name ?? "Class Teacher",
    formMasterId: formMaster?.teacherId,
    isApproved: termResult?.isApproved ?? false,
    isStamped: termResult?.isStamped ?? false,

    punctuality: assessment?.punctuality ?? null,
    neatness: assessment?.neatness ?? null,
    conduct: assessment?.conduct ?? null,

    attendance: assessment
      ? `${assessment.daysPresent ?? "—"}/${assessment.totalDays ?? "—"}`
      : (termResult?.attendance ?? ""),

    fmRemark: assessment?.formMasterRemark ?? termResult?.fmRemark ?? "",
  };

  return (
    <>
      <div className="print:hidden max-w-5xl mx-auto px-4 pt-4 pb-2 flex items-center justify-between">
        <Link
          href="/student"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <PrintButton />
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-10 print:px-0 print:pb-0">
        <div className="bg-white border border-slate-200 rounded-2xl print:rounded-none shadow-lg print:shadow-none overflow-hidden">
          <ReportHeader school={school} student={studentForComponents} />

          <div className="p-5 md:p-8 space-y-6 bg-white">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetaCard
                className="bg-slate-900 text-white"
                label="Admission No."
                value={student.admissionNo}
              />
              <MetaCard
                className="bg-amber-50 border border-amber-200 text-amber-800"
                label="Class"
                value={student.class.name.toUpperCase()}
              />
              <MetaCard
                className="bg-slate-50 border border-slate-200 text-slate-800"
                label="Attendance"
                value={studentForComponents.attendance || "—"}
              />
              <MetaCard
                className="bg-slate-50 border border-slate-200 text-slate-800"
                label="Term"
                value={`${term.name} — ${term.session.name}`}
              />
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200">
              <div className="bg-slate-900 px-5 py-3">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-300">
                  Academic Performance
                </h3>
              </div>
              <div className="overflow-x-auto">
                <AcademicRecord subjects={studentForComponents.subjects} />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Score", value: totalScore.toFixed(1) },
                { label: "Average", value: `${average.toFixed(1)}%` },
                { label: "Subjects", value: String(scores.length) },
                {
                  label: "Class Rank",
                  value: rank ? `${rank} / ${classSize}` : "—",
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center"
                >
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">
                    {label}
                  </p>
                  <p className="text-base font-black text-slate-800">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 flex flex-col gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Form Master's Remark
                </p>
                <div className="w-full min-h-[110px] p-4 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl italic leading-relaxed">
                  {studentForComponents.fmRemark || (
                    <span className="text-slate-300 not-italic">
                      No remark recorded for this term.
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl p-5 text-white flex flex-col gap-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  Behavioural Assessment
                </p>

                {(
                  [
                    ["Punctuality", studentForComponents.punctuality],
                    ["Neatness", studentForComponents.neatness],
                    ["Conduct", studentForComponents.conduct],
                  ] as const
                ).map(([trait, raw]) => {
                  const label = normaliseBehaviour(raw);
                  return (
                    <div key={trait} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                          {trait}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${behaviourColor(label)}`}
                        >
                          {label}
                        </span>
                      </div>
                      <BehaviourBar raw={raw} />
                    </div>
                  );
                })}
              </div>
            </div>

            <SignatureArea
              isApproved={studentForComponents.isApproved}
              isStamped={studentForComponents.isStamped}
              school={school}
              student={studentForComponents}
            />

            <div className="bg-slate-50 border border-slate-200 rounded-xl py-3 px-5 text-sm text-center">
              <span className="font-black text-slate-500 uppercase text-[10px] tracking-widest">
                Next Term Begins:{" "}
              </span>
              <span className="font-mono font-bold text-slate-800">
                {nextTermDate}
              </span>
            </div>

            <p className="text-center text-[10px] text-slate-300 border-t border-slate-100 pt-3">
              This result is computer-generated and authenticated by the school
              administration. Alterations render it invalid.
              {school?.website && <span> &mdash; {school.website}</span>}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function MetaCard({
  className,
  label,
  value,
}: {
  className: string;
  label: string;
  value: string;
}) {
  return (
    <div className={`p-4 rounded-xl flex flex-col gap-1 ${className}`}>
      <span className="text-[10px] font-semibold uppercase tracking-widest opacity-60">
        {label}
      </span>
      <span className="text-sm font-black uppercase leading-tight truncate">
        {value}
      </span>
    </div>
  );
}

function behaviourToInt(raw: string | null | undefined): number {
  if (!raw) return 0;
  const n = parseInt(raw, 10);
  if (!isNaN(n)) return Math.min(Math.max(n, 0), 5);
  const l = raw.toLowerCase();
  if (l.includes("excellent") || l.includes("outstanding")) return 5;
  if (l.includes("very good")) return 4;
  if (l.includes("good")) return 3;
  if (l.includes("fair")) return 2;
  return 1;
}

function BehaviourBar({ raw }: { raw: string | null | undefined }) {
  const score = behaviourToInt(raw);
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className={`flex-1 h-2 rounded-full ${
            n <= score ? "bg-emerald-500" : "bg-slate-700"
          }`}
        />
      ))}
    </div>
  );
}
