"use server";

import { signOut } from "@/lib/auth-client";
import { redirect } from "next/navigation";

export const signOutAction = async () => {
  await signOut();
  redirect("/login");
};
