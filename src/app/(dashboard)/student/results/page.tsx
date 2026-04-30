// app/(dashboard)/student/results/page.tsx
import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Lock,
  ChevronRight,
  BarChart3,
  Award,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { ResultUnlockButton } from "../_components/result-unblock-button";

// ─── Grade helpers ────────────────────────────────────────────────────────────

const GRADE_SCALE = [
  {
    min: 75,
    grade: "A",
    label: "Excellent",
    color: "text-emerald-400 bg-emerald-950/60 border-emerald-800",
  },
  {
    min: 65,
    grade: "B",
    label: "Very Good",
    color: "text-blue-400 bg-blue-950/60 border-blue-800",
  },
  {
    min: 55,
    grade: "C",
    label: "Good",
    color: "text-sky-400 bg-sky-950/60 border-sky-800",
  },
  {
    min: 45,
    grade: "D",
    label: "Fair",
    color: "text-amber-400 bg-amber-950/60 border-amber-800",
  },
  {
    min: 40,
    grade: "E",
    label: "Pass",
    color: "text-orange-400 bg-orange-950/60 border-orange-800",
  },
  {
    min: 0,
    grade: "F",
    label: "Fail",
    color: "text-red-400 bg-red-950/60 border-red-800",
  },
] as const;

function resolveGrade(avg: number) {
  return GRADE_SCALE.find((g) => avg >= g.min) ?? GRADE_SCALE.at(-1)!;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function StudentResultsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: { class: true, user: true },
  });
  if (!student) redirect("/student");

  // All term results for this student, newest first
  const termResults = await db.termResult.findMany({
    where: { studentId: student.id },
    include: {
      term: { include: { session: true } },
    },
    orderBy: [
      { term: { session: { name: "desc" } } },
      { term: { name: "desc" } },
    ],
  });

  // Which terms have had their card released to this class?
  const releasedTermIds = new Set(
    (
      await db.termCardPassword.findMany({
        where: { classId: student.classId },
        select: { termId: true },
      })
    ).map((cp) => cp.termId),
  );

  // ── Summary stats across all terms ────────────────────────────────────────
  const averages = termResults.map((r) => r.average);
  const overallAvg =
    averages.length > 0
      ? averages.reduce((a, b) => a + b, 0) / averages.length
      : 0;
  const bestAvg = averages.length > 0 ? Math.max(...averages) : 0;
  const bestRank = termResults
    .map((r) => r.rank)
    .filter(Boolean)
    .reduce(
      (best, rank) => (rank! < best! ? rank : best),
      Infinity as number | null,
    );

  // ── Trend helpers ─────────────────────────────────────────────────────────
  function trendIcon(idx: number) {
    if (idx === termResults.length - 1 || termResults.length < 2)
      return <Minus className="w-3.5 h-3.5 text-slate-500" />;
    const curr = termResults[idx].average;
    const prev = termResults[idx + 1].average;
    if (curr > prev + 1)
      return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
    if (curr < prev - 1)
      return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
    return <Minus className="w-3.5 h-3.5 text-slate-500" />;
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 px-4 md:px-0">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Academic History
          </p>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-text-primary">
            My Results
          </h1>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="font-mono font-bold">{student.admissionNo}</span>
          <span>·</span>
          <span className="uppercase font-bold">{student.class.name}</span>
        </div>
      </div>

      {/* ── Summary stat strip ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          icon={<BarChart3 className="w-4 h-4" />}
          label="Terms Recorded"
          value={String(termResults.length)}
          sub="available periods"
        />
        <SummaryCard
          icon={<BookOpen className="w-4 h-4" />}
          label="Overall Average"
          value={overallAvg > 0 ? `${overallAvg.toFixed(1)}%` : "—"}
          sub={overallAvg > 0 ? resolveGrade(overallAvg).label : "no data"}
          accent={overallAvg >= 65}
        />
        <SummaryCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Best Average"
          value={bestAvg > 0 ? `${bestAvg.toFixed(1)}%` : "—"}
          sub={bestAvg > 0 ? resolveGrade(bestAvg).label : "no data"}
          accent={bestAvg >= 65}
        />
        <SummaryCard
          icon={<Award className="w-4 h-4" />}
          label="Best Class Rank"
          value={
            bestRank !== null && bestRank !== Infinity ? `#${bestRank}` : "—"
          }
          sub="position in class"
        />
      </div>

      {/* ── Results list ────────────────────────────────────────────────── */}
      {termResults.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
            Term Records — {termResults.length} period
            {termResults.length !== 1 && "s"}
          </p>

          {termResults.map((result, idx) => {
            const g = resolveGrade(result.average);
            const released = releasedTermIds.has(result.term.id);

            return (
              <div
                key={result.id}
                className="bg-bg-surface border border-border-subtle rounded-sm overflow-hidden"
              >
                {/* Top strip */}
                <div className="flex items-center justify-between px-5 py-3 bg-bg-elevated border-b border-border-subtle">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {trendIcon(idx)}
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {result.term.session.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-600">·</span>
                    <span className="text-[11px] font-bold text-text-primary uppercase">
                      {result.term.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {result.isApproved && (
                      <Badge className="text-[9px] font-black uppercase tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-800 py-0">
                        Approved
                      </Badge>
                    )}
                    {result.isStamped && (
                      <Badge className="text-[9px] font-black uppercase tracking-wider bg-blue-950/60 text-blue-400 border border-blue-800 py-0">
                        Stamped
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0 justify-between">
                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-6">
                    {/* Grade pill */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Grade
                      </span>
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-sm border ${g.color}`}
                      >
                        {g.grade} · {g.label}
                      </span>
                    </div>

                    <StatPill
                      label="Average"
                      value={`${result.average.toFixed(1)}%`}
                    />
                    <StatPill
                      label="Total Score"
                      value={result.totalScore.toFixed(1)}
                    />
                    {result.rank && (
                      <StatPill label="Class Rank" value={`#${result.rank}`} />
                    )}
                    {result.attendance && (
                      <StatPill label="Attendance" value={result.attendance} />
                    )}
                  </div>

                  {/* CTA */}
                  <div className="shrink-0">
                    {released ? (
                      // REPLACE with:
                      <ResultUnlockButton
                        termId={result.term.id}
                        classId={student.classId}
                      />
                    ) : (
                      <div className="flex items-center gap-2 bg-bg-elevated text-slate-500 text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-sm border border-border-subtle cursor-not-allowed">
                        <Lock className="w-3.5 h-3.5" />
                        Not Released
                      </div>
                    )}
                  </div>
                </div>

                {/* FM remark preview if it exists */}
                {result.fmRemark && (
                  <div className="px-5 pb-4">
                    <p className="text-[10px] text-slate-500 italic border-l-2 border-slate-700 pl-3 leading-relaxed truncate max-w-prose">
                      &ldquo;{result.fmRemark}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Average sparkline ────────────────────────────────────────────── */}
      {termResults.length >= 2 && (
        <div className="bg-bg-surface border border-border-subtle rounded-sm p-5 md:p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
            Average Trend
          </p>
          <AverageTrend results={termResults} />
        </div>
      )}

      {/* Footer note */}
      <p className="text-center text-[10px] text-slate-500 pt-2">
        Result cards require a valid clearance code from your Form Master to
        view. Contact the school office if you have not received yours.
      </p>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-sm p-4 md:p-5 flex flex-col gap-3 border ${
        accent
          ? "bg-slate-900 border-slate-700"
          : "bg-bg-surface border-border-subtle"
      }`}
    >
      <div
        className={`w-7 h-7 rounded-sm flex items-center justify-center ${
          accent
            ? "bg-slate-700 text-amber-400"
            : "bg-bg-elevated text-slate-400"
        }`}
      >
        {icon}
      </div>
      <div>
        <p
          className={`text-[9px] font-black uppercase tracking-widest mb-1 ${
            accent ? "text-slate-400" : "text-slate-500"
          }`}
        >
          {label}
        </p>
        <p
          className={`text-xl font-black tracking-tighter ${
            accent ? "text-white" : "text-text-primary"
          }`}
        >
          {value}
        </p>
        {sub && (
          <p
            className={`text-[10px] mt-0.5 ${
              accent ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <span className="text-sm font-black text-text-primary">{value}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-sm p-10 flex flex-col items-center text-center gap-4">
      <div className="w-14 h-14 rounded-full bg-bg-elevated flex items-center justify-center border border-border-default">
        <FileText className="w-7 h-7 text-slate-500" />
      </div>
      <div className="space-y-1">
        <p className="font-black text-text-primary text-base">No Results Yet</p>
        <p className="text-xs text-slate-500 max-w-xs">
          Your term results will appear here once they have been compiled and
          approved by the school administration.
        </p>
      </div>
    </div>
  );
}

// Simple inline SVG sparkline — no chart library needed
function AverageTrend({
  results,
}: {
  results: {
    term: { name: string; session: { name: string } };
    average: number;
  }[];
}) {
  // Display oldest → newest (reverse the array since query is newest-first)
  const ordered = [...results].reverse();
  const avgs = ordered.map((r) => r.average);
  const min = Math.max(0, Math.min(...avgs) - 10);
  const max = Math.min(100, Math.max(...avgs) + 10);
  const W = 600;
  const H = 80;
  const pad = 24;

  const x = (i: number) => pad + (i / (avgs.length - 1)) * (W - pad * 2);
  const y = (v: number) => pad + ((max - v) / (max - min)) * (H - pad * 2);

  const d = avgs
    .map(
      (v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`,
    )
    .join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[320px]">
        <svg
          viewBox={`0 0 ${W} ${H + 32}`}
          className="w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Grid lines */}
          {[0, 0.5, 1].map((t) => (
            <line
              key={t}
              x1={pad}
              x2={W - pad}
              y1={pad + t * (H - pad * 2)}
              y2={pad + t * (H - pad * 2)}
              stroke="#1e293b"
              strokeWidth="1"
            />
          ))}

          {/* Area fill */}
          <path
            d={`${d} L ${x(avgs.length - 1).toFixed(1)} ${H - pad} L ${pad} ${H - pad} Z`}
            fill="url(#avgGrad)"
            opacity="0.4"
          />

          {/* Line */}
          <path
            d={d}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Dots */}
          {avgs.map((v, i) => (
            <circle
              key={i}
              cx={x(i)}
              cy={y(v)}
              r="4"
              fill="#0f172a"
              stroke="#f59e0b"
              strokeWidth="2"
            />
          ))}

          {/* Value labels */}
          {avgs.map((v, i) => (
            <text
              key={i}
              x={x(i)}
              y={y(v) - 10}
              textAnchor="middle"
              fontSize="9"
              fontWeight="bold"
              fill="#94a3b8"
            >
              {v.toFixed(1)}
            </text>
          ))}

          {/* Term labels */}
          {ordered.map((r, i) => (
            <text
              key={i}
              x={x(i)}
              y={H + 24}
              textAnchor="middle"
              fontSize="8"
              fontWeight="bold"
              fill="#475569"
            >
              {r.term.name.replace("Term", "T")}
            </text>
          ))}

          <defs>
            <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
