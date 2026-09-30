import { Novu } from "@novu/api";

const novu = new Novu({ secretKey: process.env.NOVU_SECRET_KEY });

export type MailRecipient = {
  subscriberId: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type MailPayload = Record<string, string>;

export async function sendMail(
  workflowId: string,
  to: MailRecipient | MailRecipient[],
  payload: MailPayload = {},
) {
  if (!process.env.NOVU_SECRET_KEY) {
    console.error(`[novu] NOVU_SECRET_KEY missing, skipped "${workflowId}"`);
    return { success: false, error: "Novu is not configured." };
  }

  try {
    await novu.trigger({
      workflowId,
      to,
      payload,
    });
    return { success: true };
  } catch (error) {
    console.error(`[novu] trigger "${workflowId}" failed:`, error);
    return { success: false, error: "Failed to send notification." };
  }
}

export function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}
