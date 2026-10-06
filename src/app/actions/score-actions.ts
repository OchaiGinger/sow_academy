"use server";

import { db } from "@/lib/prisma";
import { computeGrade } from "@/utils/score-utils";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ScoreInputSchema } from "@/lib/zodSchemas";

export async function getStudentsWithScores(classSubjectId: string) {
  if (!classSubjectId) return null;

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return null;
    // Single query — join everything in one shot instead of 3 round trips
    const [classSubject, currentTerm] = await Promise.all([
      db.classSubject.findUnique({
        where: { id: classSubjectId },
        select: {
          id: true,
          classId: true,
          isElective: true,
          // Only select what the UI actually renders
          class: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true } },
          teacher: {
            select: { id: true, user: { select: { name: true } } },
          },
        },
      }),
      db.term.findFirst({
        where: { isCurrent: true },
        select: {
          id: true,
          name: true,
          session: { select: { id: true, name: true } },
        },
      }),
    ]);

    if (!classSubject || !currentTerm) return null;

    if (session.user.role === "TEACHER" || session.user.role === "PRINCIPAL") {
      const teacher = await db.teacher.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (!teacher || classSubject.teacher?.id !== teacher.id) return null;
    } else if (session.user.role !== "ADMIN") {
      return null;
    }

    // Fetch students + their scores for this subject/term in one query
    const students = await db.student.findMany({
      where: {
        classId: classSubject.classId,
        ...(classSubject.isElective
          ? { electiveSubjects: { some: { classSubjectId: classSubject.id } } }
          : {}),
      },
      select: {
        id: true,
        admissionNo: true,
        user: { select: { name: true } },
        scores: {
          where: {
            classSubjectId: classSubject.id,
            termId: currentTerm.id,
          },
          select: {
            assignment1: true,
            assignment2: true,
            test1: true,
            test2: true,
            exam: true,
            total: true,
            grade: true,
            remark: true,
          },
        },
      },
      orderBy: { user: { name: "asc" } },
    });

    return { classSubject, currentTerm, students };
  } catch (error) {
    console.error("getStudentsWithScores error:", error);
    return null;
  }
}

export async function upsertScore(input: {
  studentId: string;
  classSubjectId: string;
  termId: string;
  assignment1: number;
  assignment2: number;
  test1: number;
  test2: number;
  exam: number;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const parsed = ScoreInputSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid score data");
  input = parsed.data;

  const [classSubject, student] = await Promise.all([
    db.classSubject.findUnique({
      where: { id: input.classSubjectId },
      select: { id: true, classId: true, teacherId: true, isElective: true },
    }),
    db.student.findUnique({
      where: { id: input.studentId },
      select: { id: true, classId: true },
    }),
  ]);
  if (!classSubject || !student || student.classId !== classSubject.classId) {
    throw new Error("Student does not belong to this class subject.");
  }
  if (classSubject.isElective) {
    const enrollment = await db.studentClassSubject.findUnique({
      where: {
        studentId_classSubjectId: {
          studentId: student.id,
          classSubjectId: classSubject.id,
        },
      },
      select: { id: true },
    });
    if (!enrollment) throw new Error("Student is not enrolled in this elective.");
  }
  if (session.user.role === "TEACHER" || session.user.role === "PRINCIPAL") {
    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!teacher || classSubject.teacherId !== teacher.id) {
      throw new Error("You are not assigned to this subject.");
    }
  } else if (session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const total =
    input.assignment1 +
    input.assignment2 +
    input.test1 +
    input.test2 +
    input.exam;

  const { grade, remark } = computeGrade(total);

  const scoreData = {
    assignment1: input.assignment1,
    assignment2: input.assignment2,
    test1: input.test1,
    test2: input.test2,
    exam: input.exam,
    total,
    grade,
    remark,
  };

  await db.score.upsert({
    where: {
      studentId_classSubjectId_termId: {
        studentId: input.studentId,
        classSubjectId: input.classSubjectId,
        termId: input.termId,
      },
    },
    update: scoreData,
    create: {
      studentId: input.studentId,
      classSubjectId: input.classSubjectId,
      termId: input.termId,
      ...scoreData,
    },
    // Only return id — we don't need the full record back
    select: { id: true },
  });

  // Revalidate so router.refresh() gets fresh data immediately
  revalidatePath(`/teacher/scores/${input.classSubjectId}`);
}
