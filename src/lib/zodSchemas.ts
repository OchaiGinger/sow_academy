import * as z from "zod";

// Academic Class Schema
export const classSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Name is required (e.g., JSS1A)"),
  level: z.string().min(1, "Level is required (e.g., JSS1)"),
  arm: z.string().min(1, "Arm is required (e.g., A)"),
});

export const subjectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Subject name is required"),
  code: z.string().min(2, "Subject code is required").toUpperCase(),
  classIds: z.array(z.string()).min(1, "Select at least one class"), // Added this
});

export const formMasterSchema = z.object({
  id: z.string().optional(),
  teacherId: z.string().min(1, "Please select a teacher"),
  classId: z.string().min(1, "Please select a class"),
});

export const teacherSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  // Strict array definition to prevent the "undefined" TS error
  classSubjectIds: z.array(z.string()),
});

export const studentSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().optional(),
  phone: z.string().optional(),
  classId: z.string().min(1, "Please select a class"),
  // Standard z.date() then refined for required check
  dateOfBirth: z.date().refine((date) => date !== null && date !== undefined, {
    message: "Date of birth is required",
  }),
  gender: z.enum(["MALE", "FEMALE"]),
  guardianName: z.string().min(2, "Guardian name is required"),
  guardianPhone: z.string().min(10, "Valid phone number required"),
  address: z.string().optional(),
});
export const updateStudentSchema = studentSchema.omit({ password: true });

export const ScoreInputSchema = z.object({
  studentId: z.string(),
  classSubjectId: z.string(),
  termId: z.string(),
  assignment1: z.coerce.number().min(0).max(5),
  assignment2: z.coerce.number().min(0).max(5),
  test1: z.coerce.number().min(0).max(15),
  test2: z.coerce.number().min(0).max(15),
  exam: z.coerce.number().min(0).max(60),
});

// lib/zodSchemas.ts — add these to your existing file

export const ScoreWindowSchema = z.object({
  termId: z.string(),
  component: z.enum(["ASSIGNMENT1", "ASSIGNMENT2", "TEST1", "TEST2", "EXAM"]),
  isOpen: z.boolean(),
  opensAt: z.string().optional().nullable(),
  closesAt: z.string().optional().nullable(),
});

export type ScoreWindowInput = z.infer<typeof ScoreWindowSchema>;
export type ScoreInput = z.infer<typeof ScoreInputSchema>;
export type TeacherFormValues = z.infer<typeof teacherSchema>;
export type FormMasterFormValues = z.infer<typeof formMasterSchema>;
export type SubjectFormValues = z.infer<typeof subjectSchema>;
export type ClassFormValues = z.infer<typeof classSchema>;
export type StudentFormValues = z.infer<typeof studentSchema>;
