"use server";

import { db } from "@/lib/prisma";
import { subjectSchema } from "@/lib/zodSchemas";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function upsertSubject(rawInput: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "ADMIN") {
    return { success: false, error: "Only administrators can manage subjects." };
  }

  const result = subjectSchema.safeParse(rawInput);
  if (!result.success) return { success: false, error: result.error.issues[0].message };

  const { id, name, code, isElective, classIds, electiveClassId, studentIds } = result.data;
  const offeringClassIds = isElective ? [electiveClassId!] : classIds;

  try {
    const saved = await db.$transaction(async (tx) => {
      const subject = id
        ? await tx.subject.update({ where: { id }, data: { name, code } })
        : await tx.subject.create({ data: { name, code } });

      const classes = await tx.class.findMany({
        where: { id: { in: offeringClassIds } },
        select: { id: true },
      });
      if (classes.length !== offeringClassIds.length) {
        throw new Error("One or more selected classes no longer exist.");
      }

      if (isElective) {
        const students = await tx.student.findMany({
          where: { id: { in: studentIds }, classId: electiveClassId },
          select: { id: true },
        });
        if (students.length !== studentIds.length) {
          throw new Error("Selected students must belong to the chosen class.");
        }
      }

      const existingOfferings = await tx.classSubject.findMany({
        where: { subjectId: subject.id },
        select: { id: true, classId: true },
      });
      const staleOfferings = existingOfferings.filter(
        (offering) => !offeringClassIds.includes(offering.classId),
      );

      if (staleOfferings.length > 0) {
        const scores = await tx.score.count({
          where: { classSubjectId: { in: staleOfferings.map((offering) => offering.id) } },
        });
        if (scores > 0) {
          throw new Error("Cannot remove a class offering that already has scores. Keep the offering or contact an administrator.");
        }
        await tx.classSubject.deleteMany({
          where: { id: { in: staleOfferings.map((offering) => offering.id) } },
        });
      }

      for (const classId of offeringClassIds) {
        const existingOffering = existingOfferings.find(
          (offering) => offering.classId === classId,
        );
        if (existingOffering) {
          const currentOffering = await tx.classSubject.findUnique({
            where: { id: existingOffering.id },
            select: { isElective: true },
          });
          if (currentOffering && currentOffering.isElective !== isElective) {
            const scoreCount = await tx.score.count({
              where: { classSubjectId: existingOffering.id },
            });
            if (scoreCount > 0) {
              throw new Error("Cannot change a required subject to elective (or vice versa) after scores have been recorded.");
            }
          }
        }

        const offering = await tx.classSubject.upsert({
          where: { classId_subjectId: { classId, subjectId: subject.id } },
          update: { isElective },
          create: { classId, subjectId: subject.id, isElective },
          select: { id: true },
        });

        if (isElective) {
          const removedStudents = await tx.studentClassSubject.findMany({
            where: {
              classSubjectId: offering.id,
              studentId: { notIn: studentIds },
            },
            select: { studentId: true },
          });
          if (removedStudents.length > 0) {
            const scoreCount = await tx.score.count({
              where: {
                classSubjectId: offering.id,
                studentId: { in: removedStudents.map((enrollment) => enrollment.studentId) },
              },
            });
            if (scoreCount > 0) {
              throw new Error("Cannot remove students from this elective after scores have been recorded for them.");
            }
          }
          await tx.studentClassSubject.deleteMany({
            where: {
              classSubjectId: offering.id,
              studentId: { notIn: studentIds },
            },
          });
          await tx.studentClassSubject.createMany({
            data: studentIds.map((studentId) => ({
              studentId,
              classSubjectId: offering.id,
            })),
            skipDuplicates: true,
          });
        } else {
          await tx.studentClassSubject.deleteMany({
            where: { classSubjectId: offering.id },
          });
        }
      }

      return subject;
    });

    revalidatePath("/admin/subjects");
    revalidatePath("/admin/teachers");
    revalidatePath("/teacher/scores");
    revalidatePath("/student");
    revalidatePath("/form-master/results");
    return { success: true, id: saved.id };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database error: Check for unique constraints.",
    };
  }
}

export async function deleteSubject(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "ADMIN") {
    return { success: false, error: "Only administrators can manage subjects." };
  }

  try {
    await db.subject.delete({ where: { id } });
    revalidatePath("/admin/subjects");
    return { success: true };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to delete subject.");
  }
}
