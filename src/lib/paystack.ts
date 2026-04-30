const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const BASE_URL = "https://api.paystack.co";

export async function initializeTransaction(data: {
  email: string;
  amount: number; // in kobo
  reference: string;
  metadata?: Record<string, unknown>;
  callback_url: string;
}) {
  const res = await fetch(`${BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function verifyTransaction(reference: string) {
  const res = await fetch(`${BASE_URL}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });
  return res.json();
}

export function generateReference(studentId: string, termId: string): string {
  return `SCH-${studentId.slice(0, 6)}-${termId.slice(0, 6)}-${Date.now()}`;
}
