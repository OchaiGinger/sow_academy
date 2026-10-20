import { db } from "@/lib/prisma";
import { ValidationSheetsClient } from "./_components/validation-sheets-client";

export default async function AdminValidationSheetsPage() {
  const [classes, school] = await Promise.all([
    db.class.findMany({
      include: {
        students: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
          },
          orderBy: { admissionNo: "asc" },
        },
      },
      orderBy: [{ level: "asc" }, { arm: "asc" }],
    }),
    db.school.findFirst({
      select: { name: true, email: true, logoUrl: true, address: true, phone: true },
    }),
  ]);

  // Transform to match the expected type
  const transformedClasses = classes.map(c => ({
    id: c.id,
    name: c.name,
    level: c.level,
    arm: c.arm,
    students: c.students.map(s => ({
      id: s.id,
      admissionNo: s.admissionNo,
      user: s.user,
      class: c,
      dateOfBirth: s.dateOfBirth,
      gender: s.gender,
      guardianName: s.guardianName,
      guardianPhone: s.guardianPhone,
    })),
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Validation Sheets
          </h1>
          <p className="text-text-tertiary italic text-sm">
            Print validation sheets for students and teachers to verify their records.
          </p>
        </div>
        <div className="text-xs text-text-tertiary">
          Total: <span className="font-bold text-text-primary">{classes.length}</span> classes
        </div>
      </div>

      <ValidationSheetsClient
        classes={transformedClasses}
        school={{
          name: school?.name ?? "SOWA Academy",
          email: school?.email ?? "",
          logoUrl: school?.logoUrl ?? null,
          address: school?.address ?? "",
          phone: school?.phone ?? "",
        }}
      />
    </div>
  );
}