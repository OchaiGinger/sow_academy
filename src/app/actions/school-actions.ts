"use server";

import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type School = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  website: string | null;
  motto: string | null;
  principalName: string | null;
  resultCardPrice: number;
  createdAt: Date;
  updatedAt: Date;
  adminUserId: string;
};

export async function getSchools() {
  try {
    const schools = await db.school.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        website: true,
        motto: true,
        principalName: true,
        resultCardPrice: true,
        createdAt: true,
        updatedAt: true,
        adminUserId: true,
      },
    });
    return { success: true, schools };
  } catch {
    return { success: false, error: "Failed to fetch schools." };
  }
}

export async function updateSchool(id: string, data: {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  motto?: string;
  principalName?: string;
  resultCardPrice?: number;
}) {
  try {
    const school = await db.school.update({
      where: { id },
      data,
      select: { id: true },
    });
    revalidatePath("/super-admin");
    revalidatePath("/admin/settings");
    return { success: true, school };
  } catch {
    return { success: false, error: "Failed to update school." };
  }
}

export async function deleteSchool(id: string) {
  try {
    await db.school.delete({ where: { id } });
    revalidatePath("/super-admin");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete school." };
  }
}
