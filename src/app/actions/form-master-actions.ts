// app/actions/form-master-actions.ts
"use server";

import { db } from "@/lib/prisma";
import { formMasterSchema } from "@/lib/zodSchemas";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function assignFormMaster(rawInput: unknown) {
  const result = formMasterSchema.safeParse(rawInput);
  if (!result.success) return { success: false, error: "Invalid data" };

  const { teacherId, classId } = result.data;

  try {
    const existing = await db.formMaster.findUnique({ where: { classId } });

    if (existing) {
      await db.formMaster.update({ where: { classId }, data: { teacherId } });
    } else {
      await db.formMaster.create({ data: { teacherId, classId } });
    }

    revalidatePath("/admin/form-masters");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return {
        success: false,
        error: "This teacher is already a Form Master for another class.",
      };
    }
    return { success: false, error: "An error occurred." };
  }
}

export async function removeFormMaster(id: string) {
  await db.formMaster.delete({ where: { id } });
  revalidatePath("/admin/form-masters");
}

export async function getFormMasterClassData(userId: string) {
  try {
    const school = (await db.school.findFirst()) ?? {
      name: "SCHOOL NAME",
      address: "SCHOOL ADDRESS",
      motto: "Knowledge is Power",
      logoUrl: null,
      stampUrl: null,
    };

    const currentTerm = await db.term.findFirst({ where: { isCurrent: true } });
    if (!currentTerm) return null;

    const teacher = await db.teacher.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!teacher) return null;

    const formMasterRecord = await db.formMaster.findUnique({
      where: { teacherId: teacher.id },
      include: {
        class: {
          include: {
            students: {
              include: {
                user: { select: { name: true } },
                scores: {
                  where: { termId: currentTerm.id },
                  include: { classSubject: { include: { subject: true } } },
                },
                termResults: {
                  where: { termId: currentTerm.id },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!formMasterRecord?.class) return null;

    // ── Fetch ALL subjects assigned to this class ──────────────────────────
    // This is the source of truth for what should appear on every report card.
    const classSubjects = await db.classSubject.findMany({
      where: { classId: formMasterRecord.class.id },
      include: { subject: true },
      orderBy: { subject: { name: "asc" } },
    });

    const totalInClass = formMasterRecord.class.students.length;

    const compiledResults = formMasterRecord.class.students.map((student) => {
      const termScores = student.scores;
      const totalSum = termScores.reduce((acc, s) => acc + (s.total ?? 0), 0);
      const avg = termScores.length > 0 ? totalSum / termScores.length : 0;

      const termResult = student.termResults[0] ?? null;

      return {
        studentId: student.id,
        name: student.user.name,
        totalInClass,

        isApproved: termResult?.isApproved ?? false,
        isStamped: termResult?.isStamped ?? false,

        attendance: termResult?.attendance ?? "",
        punctuality: termResult?.punctuality ?? "",
        neatness: termResult?.neatness ?? "",
        conduct: termResult?.conduct ?? "",
        fmRemark: termResult?.fmRemark ?? "",

        subjects: termScores.map((s) => ({
          name: s.classSubject.subject.name,
          a1: s.assignment1 ?? 0,
          a2: s.assignment2 ?? 0,
          t1: s.test1 ?? 0,
          t2: s.test2 ?? 0,
          caTotal:
            (s.assignment1 ?? 0) +
            (s.assignment2 ?? 0) +
            (s.test1 ?? 0) +
            (s.test2 ?? 0),
          exam: s.exam ?? 0,
          total: s.total ?? 0,
          grade: s.grade ?? "-",
          remark: s.remark ?? "-",
        })),

        totalScore: totalSum,
        average: avg,
      };
    });

    const sorted = [...compiledResults].sort((a, b) => b.average - a.average);
    const results = compiledResults.map((s) => ({
      ...s,
      rank: sorted.findIndex((x) => x.studentId === s.studentId) + 1,
    }));

    return {
      school,
      classId: formMasterRecord.class.id, // ← NEW
      className: formMasterRecord.class.name,
      termName: currentTerm.name,
      termId: currentTerm.id,
      results,
      classSubjects: classSubjects.map((cs) => ({
        // ← NEW
        id: cs.id,
        name: cs.subject.name,
      })),
    };
  } catch (e) {
    console.error("[getFormMasterClassData]", e);
    return null;
  }
}

export async function saveStudentReport(
  studentId: string,
  formData: {
    attendance: string;
    punctuality: string;
    neatness: string;
    conduct: string;
    fmRemark: string;
  },
  stats: {
    average: number;
    rank: number;
    totalScore: number;
    termId: string;
  },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  if (!stats.termId) {
    return { success: false, error: "Missing termId — cannot save report." };
  }

  await db.termResult.upsert({
    where: { studentId_termId: { studentId, termId: stats.termId } },
    update: {
      attendance: formData.attendance,
      punctuality: formData.punctuality,
      neatness: formData.neatness,
      conduct: formData.conduct,
      fmRemark: formData.fmRemark,
      isApproved: true,
      approvedBy: session.user.id,
      average: stats.average,
      totalScore: stats.totalScore,
      rank: stats.rank,
    },
    create: {
      studentId,
      termId: stats.termId,
      attendance: formData.attendance,
      punctuality: formData.punctuality,
      neatness: formData.neatness,
      conduct: formData.conduct,
      fmRemark: formData.fmRemark,
      isApproved: true,
      approvedBy: session.user.id,
      average: stats.average,
      totalScore: stats.totalScore,
      rank: stats.rank,
    },
  });

  revalidatePath("/form-master/results");
  revalidatePath("/principal/stamping");
  return { success: true };
}

export async function principalStampSingle(studentId: string, termId: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user.role !== "PRINCIPAL") {
    return { success: false, error: "Only the Principal can apply the seal." };
  }

  await db.termResult.update({
    where: { studentId_termId: { studentId, termId } },
    data: {
      isStamped: true,
      stampedBy: session.user.id,
      stampedAt: new Date(),
    },
  });

  revalidatePath("/principal/stamping");
  return { success: true };
}
