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
  await db.class.delete({ where: { id } });
  revalidatePath("/admin/classes");
}
