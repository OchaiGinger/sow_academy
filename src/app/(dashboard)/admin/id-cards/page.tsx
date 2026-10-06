import { db } from "@/lib/prisma";
import { IdCardsClient } from "./_components/id-cards-client";

export default async function AdminIdCardsPage() {
  const students = await db.student.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true } },
      class: { select: { name: true, level: true, arm: true } },
    },
    orderBy: { admissionNo: "asc" },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Student ID Cards
          </h1>
          <p className="text-text-tertiary italic text-sm">
            Print ID cards for all students. 2 cards per A4 page.
          </p>
        </div>
        <div className="text-xs text-text-tertiary">
          Total: <span className="font-bold text-text-primary">{students.length}</span> students
        </div>
      </div>

      <IdCardsClient students={students} />
    </div>
  );
}
