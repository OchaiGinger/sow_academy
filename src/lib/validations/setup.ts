import { z } from "zod";

export const step1Schema = z.object({
  schoolName: z.string().min(3, "School name is too short"),
  schoolEmail: z.string().email("Invalid email address"),
  schoolPhone: z.string().optional(),
  schoolAddress: z.string().optional(),
  schoolWebsite: z.string().url("Invalid URL").optional().or(z.literal("")),
  schoolDescription: z.string().max(200, "Description too long").optional(),
});

export const step2Schema = z.object({
  schoolLogo: z.string().optional(),
  schoolStamp: z.string().optional(),
  schoolMotto: z.string().optional(),
  principalName: z.string().min(3, "Principal's name is too short"),
});

export const step3Schema = z.object({
  adminName: z.string().min(3, "Admin name is too short"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a digit"),
  confirmPassword: z.string(),
  resultCardPrice: z.coerce.number().min(0),
});

// Merge first, refine last
export const setupFormSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SetupFormData = z.infer<typeof setupFormSchema>;
