"use server";

import { db } from "@/lib/prisma";

import { revalidatePath } from "next/cache";

export async function setClassPassword(
  termId: string,
  classId: string,
  password: string,
) {
  await db.termCardPassword.upsert({
    where: {
      termId_classId: { termId, classId },
    },
    update: { password },
    create: { termId, classId, password },
  });
  revalidatePath("/admin/passwords");
}
