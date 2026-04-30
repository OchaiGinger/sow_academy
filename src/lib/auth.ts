import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh token every 24h
  },

  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
        input: false, // not settable by client
        returned: true, // include in session
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "STUDENT",
        input: false, // NEVER true — blocks clients from self-assigning ADMIN
        returned: true, // include in session so session.user.role works
      },
    },
  },

  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL!],
});

export type Session = typeof auth.$Infer.Session;
