"use server";

import { db } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendMail, splitName, type MailRecipient } from "@/lib/novu";

const WORKFLOW_ID = "teacher-welcome-email";

export async function broadcastToTeachers(title: string, message: string) {
  const trimmedTitle = title.trim();
  const trimmedMessage = message.trim();

  if (!trimmedTitle || !trimmedMessage) {
    return { success: false, error: "Title and message are required." };
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Only an admin can send announcements." };
  }

  const teachers = await db.teacher.findMany({
    select: { user: { select: { id: true, name: true, email: true } } },
  });

  if (teachers.length === 0) {
    return { success: false, error: "There are no teachers to notify." };
  }

  const recipients: MailRecipient[] = teachers.map(({ user }) => ({
    subscriberId: user.id,
    ...splitName(user.name),
    email: user.email,
  }));

  const res = await sendMail(
    WORKFLOW_ID,
    recipients,
    {
      title: trimmedTitle,
      message: trimmedMessage,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL}/teacher`,
    },
  );

  if (!res.success) {
    return { success: false, error: "Failed to send the announcement." };
  }

  return { success: true, recipientCount: recipients.length };
}
