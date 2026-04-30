// app/(dashboard)/principal/stamping/page.tsx
import { db } from "@/lib/prisma";
import { StampingClient } from "./_components/stamping-client";

export default async function PrincipalStampingPage() {
  const currentTerm = await db.term.findFirst({ where: { isCurrent: true } });
  if (!currentTerm) return <div>No active term found.</div>;

  const classes = await db.class.findMany({
    select: {
      id: true,
      name: true,
      _count: { select: { students: true } },
    },
  });

  const classStats = await Promise.all(
    classes.map(async (cls) => {
      // ❌ Before: classId: cls.id  → doesn't exist on TermResult
      // ✅ After:  filter through the student relation instead
      const baseWhere = {
        termId: currentTerm.id,
        student: { classId: cls.id }, // ← class lives on the Student row
      };

      const approvedCount = await db.termResult.count({
        where: { ...baseWhere, isApproved: true },
      });

      const pendingStampCount = await db.termResult.count({
        where: { ...baseWhere, isApproved: true, isStamped: false },
      });

      return { ...cls, approvedCount, pendingStampCount };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-primary">
          OFFICIAL SEALING
        </h1>
        <p className="text-text-tertiary text-sm italic">
          Verify and apply the institutional stamp to student results for
          {currentTerm.name}.
        </p>
      </div>
      <StampingClient classes={classStats} termId={currentTerm.id} />
    </div>
  );
}
