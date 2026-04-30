// app/(dashboard)/student/page.tsx
import { StatsCard } from "@/components/shared/stats-card";
import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Unlock, Lock, FileText } from "lucide-react";
import { redirect } from "next/navigation";

export default async function StudentDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/login");

  const student = await db.student.findUnique({
    where: { userId: session.user.id },
    include: { class: true },
  });

  if (!student)
    return <div className="p-8 text-center">Student profile not found.</div>;

  const activeTerm = await db.term.findFirst({
    where: { isCurrent: true },
    include: {
      cardPassword: {
        where: { classId: student.classId },
      },
    },
  });

  const isReleased = !!activeTerm?.cardPassword.length;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 px-4 md:px-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-text-primary">
            Welcome, {session.user.name}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-bg-elevated border-border-default text-text-secondary tabular font-mono text-[10px] uppercase">
              {student.admissionNo}
            </Badge>
            <Badge className="bg-accent-muted text-primary border-primary/20 tabular font-mono text-[10px] uppercase">
              {student.class.name}
            </Badge>
          </div>
        </div>

        {/* Current Term Info - Mobile Friendly */}
        <div className="bg-bg-surface border border-border-subtle p-3 rounded-sm flex items-center gap-4 w-full md:w-auto">
          <div className="flex flex-col">
            <span className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold">
              Current Academic Term
            </span>
            <span className="text-sm font-mono font-bold text-text-primary uppercase">
              {activeTerm?.name || "No Active Term"}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid - Responsive Column Spans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Registered Subjects" value="-" />
        <StatsCard label="Term Average" value="0.0" trend="neutral" />
        <StatsCard label="Class Rank" value="-" />
        <StatsCard
          label="Status"
          value={isReleased ? "RELEASED" : "COMPILING"}
          accent={!isReleased}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Result Access Control Card */}
        <div className="bg-bg-surface border border-border-subtle rounded-sm p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider">
              Term Result Access
            </h2>
            <Badge
              className={`${isReleased ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"} text-[10px] font-bold`}
            >
              {isReleased ? "AVAILABLE" : "PROCESSING"}
            </Badge>
          </div>

          <div className="flex flex-col items-center justify-center py-6 md:py-10 space-y-4 text-center">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-bg-elevated flex items-center justify-center border border-border-default mb-2">
              {!isReleased ? (
                <Lock className="w-6 h-6 md:w-8 md:h-8 text-text-tertiary" />
              ) : (
                <Unlock className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              )}
            </div>

            <div className="space-y-1 max-w-xs">
              <p className="text-text-primary font-bold text-base md:text-lg">
                {isReleased ? "Unlock Result Card" : "Results Not Ready"}
              </p>
              <p className="text-text-secondary text-[11px] md:text-xs leading-relaxed">
                {isReleased
                  ? "Enter the 6-digit clearance code provided by your Form Master."
                  : "The administration is currently finalizing the broadsheet. Please check back later."}
              </p>
            </div>

            <div className="w-full max-w-xs space-y-3 pt-4">
              {isReleased ? (
                <>
                  <input
                    type="text"
                    placeholder="ENTER CODE"
                    className="w-full p-3 bg-bg-input border border-border-default text-center font-mono font-bold tracking-widest uppercase text-sm rounded-sm focus:ring-1 focus:ring-primary outline-none"
                  />
                  <Button className="w-full bg-primary text-white font-black uppercase tracking-tighter py-6">
                    View Official Result
                  </Button>
                </>
              ) : (
                <Button
                  disabled
                  className="w-full font-bold opacity-50 cursor-not-allowed py-6"
                >
                  Access Restricted
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Notices Section */}
        <div className="bg-bg-surface border border-border-subtle rounded-sm p-5 md:p-6">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-4 h-4 text-text-tertiary" />
            <h2 className="text-xs md:text-sm font-bold uppercase tracking-wider">
              Academic Notices
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 border-l-4 border-primary bg-bg-elevated rounded-r-sm">
              <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">
                Upcoming Milestone
              </p>
              <p className="text-sm font-bold text-text-primary">
                Next Term Resumption
              </p>
              <p className="text-xs text-text-secondary mt-1 tabular">
                Scheduled Date:{" "}
                {activeTerm?.nextTermDate
                  ? activeTerm.nextTermDate.toDateString()
                  : "To be announced"}
              </p>
            </div>

            <p className="text-[10px] text-text-tertiary italic text-center mt-8 px-2">
              Official school stamps are applied automatically to all generated
              PDF result cards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
