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

  const { teacherId } = result.data;
  const classIds = [...new Set(result.data.classIds)];

  try {
    await db.$transaction(
      classIds.map((classId) =>
        db.formMaster.upsert({
          where: { classId },
          update: { teacherId },
          create: { teacherId, classId },
        }),
      ),
    );

    revalidatePath("/admin/form-masters");
    revalidatePath("/admin/teachers");
    revalidatePath("/form-master");
    revalidatePath("/form-master/results");
    return { success: true };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      const target = "meta" in error && error.meta && typeof error.meta === "object" && "target" in error.meta
        ? JSON.stringify(error.meta.target)
        : "";
      if (target.toLowerCase().includes("teacherid")) {
        return {
          success: false,
          error: "The database still has the old one-class-per-teacher restriction. Apply the latest Prisma migrations, then retry.",
        };
      }
      return { success: false, error: "One or more classes are already assigned. Refresh and try again." };
    }
    return { success: false, error: "An error occurred." };
  }
}

export async function removeFormMaster(id: string) {
  await db.formMaster.delete({ where: { id } });
  revalidatePath("/admin/form-masters");
  revalidatePath("/admin/teachers");
  revalidatePath("/form-master");
  revalidatePath("/form-master/results");
}

export async function getFormMasterClassData(userId: string, requestedClassId?: string) {
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

    const formMasterRecords = await db.formMaster.findMany({
      where: { teacherId: teacher.id },
      select: {
        classId: true,
        class: {
          select: {
            id: true,
            name: true,
            _count: { select: { students: true } },
          },
        },
      },
      orderBy: { class: { name: "asc" } },
    });

    if (formMasterRecords.length === 0) return null;

    const selectedClassId = formMasterRecords.some(
      (record) => record.classId === requestedClassId,
    )
      ? requestedClassId!
      : formMasterRecords[0].classId;

    const formMasterRecord = await db.formMaster.findFirst({
      where: { teacherId: teacher.id, classId: selectedClassId },
      include: {
        class: {
          include: {
            students: {
              include: {
                user: { select: { name: true } },
                scores: {
                  where: { termId: currentTerm.id },
                  include: {
                    classSubject: {
                      include: {
                        subject: true,
                        studentEnrollments: { select: { studentId: true } },
                      },
                    },
                  },
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
      include: {
        subject: true,
        studentEnrollments: { select: { studentId: true } },
      },
      orderBy: { subject: { name: "asc" } },
    });

    const totalInClass = formMasterRecord.class.students.length;

    const compiledResults = formMasterRecord.class.students.map((student) => {
      const termScores = student.scores.filter((score) =>
        !score.classSubject.isElective ||
        score.classSubject.studentEnrollments.some((enrollment) => enrollment.studentId === student.id),
      );
      const totalSum = termScores.reduce((acc, s) => acc + (s.total ?? 0), 0);
      const avg = termScores.length > 0 ? totalSum / termScores.length : 0;

      const termResult = student.termResults[0] ?? null;

      return {
        studentId: student.id,
        name: student.user.name,
        admissionNo: student.admissionNo,
        photo: student.photo,
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
      classes: formMasterRecords.map((record) => ({
        id: record.class.id,
        name: record.class.name,
        studentCount: record.class._count.students,
      })),
      classId: formMasterRecord.class.id, // ← NEW
      className: formMasterRecord.class.name,
      termName: currentTerm.name,
      termId: currentTerm.id,
      results,
      classSubjects: classSubjects.map((cs) => ({
        id: cs.id,
        name: cs.subject.name,
      })),
      subjectsByStudent: Object.fromEntries(
        formMasterRecord.class.students.map((student) => [
          student.id,
          classSubjects
            .filter((cs) => !cs.isElective || cs.studentEnrollments.some((enrollment) => enrollment.studentId === student.id))
            .map((cs) => ({ id: cs.id, name: cs.subject.name })),
        ]),
      ),
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
    termId: string;
    approve?: boolean;
  },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!teacher) return { success: false, error: "Only an assigned form master can edit this report." };

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { id: true, classId: true },
  });
  if (!student) return { success: false, error: "Student not found." };

  const assignment = await db.formMaster.findUnique({
    where: { classId: student.classId },
    select: { teacherId: true },
  });
  if (assignment?.teacherId !== teacher.id) {
    return { success: false, error: "You are not the form master for this student's class." };
  }

  const term = await db.term.findUnique({
    where: { id: stats.termId },
    select: { id: true },
  });
  if (!term) return { success: false, error: "Term not found." };

  if (!stats.termId) {
    return { success: false, error: "Missing termId — cannot save report." };
  }

  const ratings = [formData.punctuality, formData.neatness, formData.conduct];
  if (ratings.some((rating) => !/^([1-9]|10)$/.test(rating))) {
    return { success: false, error: "Behaviour ratings must be between 1 and 10." };
  }
  const attendance = formData.attendance.trim();
  const attendanceMatch = attendance ? attendance.match(/^(\d{1,3})\s*\/\s*(\d{1,3})$/) : null;
  if (attendance && !attendanceMatch) {
    return { success: false, error: "Attendance must use days-present/total-days format, e.g. 84/90." };
  }
  if (attendanceMatch && Number(attendanceMatch[1]) > Number(attendanceMatch[2])) {
    return { success: false, error: "Days present cannot exceed total days." };
  }
  if (formData.fmRemark.length > 1500) {
    return { success: false, error: "The form master's remark must be 1,500 characters or fewer." };
  }

  const existingResult = await db.termResult.findUnique({
    where: { studentId_termId: { studentId, termId: stats.termId } },
    select: { isStamped: true },
  });
  if (existingResult?.isStamped) {
    return { success: false, error: "This report is locked because it has already been stamped." };
  }

  const approve = stats.approve === true;
  const [classSubjects, classStudents] = await Promise.all([
    db.classSubject.findMany({
      where: { classId: student.classId },
      select: {
        id: true,
        isElective: true,
        studentEnrollments: { select: { studentId: true } },
      },
    }),
    db.student.findMany({ where: { classId: student.classId }, select: { id: true } }),
  ]);
  const classSubjectIds = classSubjects.map((subject) => subject.id);
  const scores = classSubjectIds.length
    ? await db.score.findMany({
        where: { termId: stats.termId, classSubjectId: { in: classSubjectIds } },
        select: {
          studentId: true,
          classSubjectId: true,
          total: true,
          assignment1: true,
          assignment2: true,
          test1: true,
          test2: true,
          exam: true,
        },
      })
    : [];

  const eligibleSubjectIdsByStudent = new Map(
    classStudents.map((classStudent) => [
      classStudent.id,
      new Set(classSubjects
        .filter((subject) => !subject.isElective || subject.studentEnrollments.some((enrollment) => enrollment.studentId === classStudent.id))
        .map((subject) => subject.id)),
    ]),
  );
  const compiled = classStudents.map((classStudent) => {
    const eligibleIds = eligibleSubjectIdsByStudent.get(classStudent.id) ?? new Set<string>();
    const studentScores = scores.filter((score) => score.studentId === classStudent.id && eligibleIds.has(score.classSubjectId));
    const totalScore = studentScores.reduce((sum, score) => sum + (score.total ?? score.assignment1 + score.assignment2 + score.test1 + score.test2 + score.exam), 0);
    return {
      studentId: classStudent.id,
      totalScore,
      average: studentScores.length ? totalScore / studentScores.length : 0,
      scoredCount: studentScores.length,
      eligibleCount: eligibleIds.size,
    };
  });
  if (approve) {
    const currentStudent = compiled.find((result) => result.studentId === studentId);
    if (currentStudent && currentStudent.scoredCount < currentStudent.eligibleCount) {
      return { success: false, error: "Complete this student's eligible subject scores before approving the report." };
    }
  }
  const orderedResults = [...compiled].sort((a, b) => b.average - a.average);
  const studentStats = compiled.find((result) => result.studentId === studentId);
  if (!studentStats) return { success: false, error: "Student is not in your assigned class." };
  const reportStats = {
    average: studentStats.average,
    totalScore: studentStats.totalScore,
    rank: orderedResults.findIndex((result) => result.studentId === studentId) + 1,
  };

  const daysPresent = attendanceMatch ? Number(attendanceMatch[1]) : null;
  const totalDays = attendanceMatch ? Number(attendanceMatch[2]) : null;

  await db.$transaction([
    db.termResult.upsert({
      where: { studentId_termId: { studentId, termId: stats.termId } },
      update: {
        attendance,
        punctuality: formData.punctuality,
        neatness: formData.neatness,
        conduct: formData.conduct,
        fmRemark: formData.fmRemark.trim(),
        isApproved: approve,
        approvedBy: approve ? session.user.id : null,
        signatureData: approve ? undefined : null,
        average: reportStats.average,
        totalScore: reportStats.totalScore,
        rank: reportStats.rank,
      },
      create: {
        studentId,
        termId: stats.termId,
        attendance,
        punctuality: formData.punctuality,
        neatness: formData.neatness,
        conduct: formData.conduct,
        fmRemark: formData.fmRemark.trim(),
        isApproved: approve,
        approvedBy: approve ? session.user.id : null,
        average: reportStats.average,
        totalScore: reportStats.totalScore,
        rank: reportStats.rank,
      },
    }),
    db.assessment.upsert({
      where: { studentId_termId: { studentId, termId: stats.termId } },
      update: {
        punctuality: formData.punctuality,
        neatness: formData.neatness,
        conduct: formData.conduct,
        formMasterRemark: formData.fmRemark.trim(),
        daysPresent,
        daysAbsent: daysPresent !== null && totalDays !== null ? Math.max(0, totalDays - daysPresent) : null,
        totalDays,
      },
      create: {
        studentId,
        termId: stats.termId,
        punctuality: formData.punctuality,
        neatness: formData.neatness,
        conduct: formData.conduct,
        formMasterRemark: formData.fmRemark.trim(),
        daysPresent,
        daysAbsent: daysPresent !== null && totalDays !== null ? Math.max(0, totalDays - daysPresent) : null,
        totalDays,
      },
    }),
  ]);

  revalidatePath("/form-master/results");
  revalidatePath(`/student/results/${stats.termId}`);
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
