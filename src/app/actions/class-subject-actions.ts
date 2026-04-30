// src/app/actions/class-subject-actions.ts
"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function assignSubjectToClass(data: {
  classId: string;
  subjectId: string;
  teacherId?: string;
}) {
  try {
    await db.classSubject.upsert({
      where: {
        classId_subjectId: {
          classId: data.classId,
          subjectId: data.subjectId,
        },
      },
      update: {
        teacherId: data.teacherId ?? null,
      },
      create: {
        classId: data.classId,
        subjectId: data.subjectId,
        teacherId: data.teacherId ?? null,
      },
    });

    revalidatePath("/admin/classes");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to assign subject to class." };
  }
}

export async function removeSubjectFromClass(classSubjectId: string) {
  await db.classSubject.delete({ where: { id: classSubjectId } });
  revalidatePath("/admin/classes");
}
