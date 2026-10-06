"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function upsertClass(data: {
  id?: string;
  name: string;
  level: string;
  arm: string;
}) {
  try {
    if (data.id) {
      await db.class.update({
        where: { id: data.id },
        data: { name: data.name, level: data.level, arm: data.arm },
        select: { id: true },
      });
    } else {
      await db.class.create({
        data: { name: data.name, level: data.level, arm: data.arm },
        select: { id: true },
      });
    }
    revalidatePath("/admin/classes");
    return { success: true };
  } catch {
    return { success: false, error: "Class name must be unique." };
  }
}

export async function deleteClass(id: string) {
  try {
    const cls = await db.class.findUnique({
      where: { id },
      select: {
        id: true,
        students: { select: { id: true } },
        classSubjects: { select: { id: true } },
        formMasters: { select: { id: true } },
      },
    });

    if (!cls) return { success: false, error: "Class not found." };

    const blockers: string[] = [];
    if (cls.students.length > 0) blockers.push(`${cls.students.length} students`);
    if (cls.classSubjects.length > 0) blockers.push(`${cls.classSubjects.length} subjects`);
    if (cls.formMasters.length > 0) blockers.push("a form master");

    if (blockers.length > 0) {
      return {
        success: false,
        error: `Cannot delete class because it still has: ${blockers.join(", ")}. Please reassign or remove them first.`,
      };
    }

    await db.class.delete({ where: { id } });
    revalidatePath("/admin/classes");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete class." };
  }
}
