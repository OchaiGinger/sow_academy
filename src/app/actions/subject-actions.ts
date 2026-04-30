"use server";

import { db } from "@/lib/prisma";
import { subjectSchema } from "@/lib/zodSchemas";
import { revalidatePath } from "next/cache";

export async function upsertSubject(rawInput: any) {
  const result = subjectSchema.safeParse(rawInput);
  if (!result.success) return { success: false, error: "Invalid data" };

  const { id, name, code, classIds } = result.data;

  try {
    if (id) {
      await db.subject.update({
        where: { id },
        data: {
          name,
          code,
          classSubjects:
            classIds !== undefined
              ? {
                  deleteMany: {},
                  create: classIds.map((classId: string) => ({
                    class: { connect: { id: classId } },
                  })),
                }
              : undefined,
        },
        select: { id: true },
      });
    } else {
      await db.subject.create({
        data: {
          name,
          code,
          classSubjects: {
            create: classIds?.map((classId: string) => ({
              class: { connect: { id: classId } },
            })),
          },
        },
        select: { id: true },
      });
    }
    revalidatePath("/admin/subjects");
    return { success: true };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Database error: Check for unique constraints.",
    };
  }
}

export async function deleteSubject(id: string) {
  try {
    await db.subject.delete({ where: { id } });
    revalidatePath("/admin/subjects");
    return { success: true };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to delete subject.");
  }
}
