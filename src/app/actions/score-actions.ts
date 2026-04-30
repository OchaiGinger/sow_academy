"use server";

import { db } from "@/lib/prisma";
import { computeGrade } from "@/utils/score-utils";
import { revalidatePath } from "next/cache";

export async function getStudentsWithScores(classSubjectId: string) {
  if (!classSubjectId) return null;

  try {
    // Single query — join everything in one shot instead of 3 round trips
    const [classSubject, currentTerm] = await Promise.all([
      db.classSubject.findUnique({
        where: { id: classSubjectId },
        select: {
          id: true,
          classId: true,
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

    // Fetch students + their scores for this subject/term in one query
    const students = await db.student.findMany({
      where: { classId: classSubject.classId },
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
