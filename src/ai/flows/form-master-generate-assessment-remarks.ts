'use server';
/**
 * @fileOverview A Genkit flow to assist Form Masters in drafting personalized assessment remarks for students.
 *
 * - generateAssessmentRemarks - A function that generates draft assessment remarks.
 * - GenerateAssessmentRemarksInput - The input type for the generateAssessmentRemarks function.
 * - GenerateAssessmentRemarksOutput - The return type for the generateAssessmentRemarks function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ScoreSummarySchema = z.object({
  subject: z.string().describe('The name of the subject.'),
  total: z.number().describe('The total score in the subject.'),
  grade: z.string().describe('The grade obtained in the subject (e.g., A1, B2, F9).'),
  remark: z.string().describe('The remark for the subject (e.g., Excellent, Fail).'),
});

const GenerateAssessmentRemarksInputSchema = z.object({
  studentName: z.string().describe("The student's full name."),
  class: z.string().describe("The student's class (e.g., JSS1A)."),
  term: z.string().describe("The current academic term (e.g., First Term)."),
  session: z.string().describe("The current academic session (e.g., 2024/2025)."),
  scores: z.array(ScoreSummarySchema).describe('A list of subject scores, grades, and remarks for the student.'),
  attendance: z.object({
    daysPresent: z.number().describe('Number of days the student was present.'),
    daysAbsent: z.number().describe('Number of days the student was absent.'),
    totalDays: z.number().describe('Total number of school days.'),
  }).describe('Student attendance record.'),
  behavioralTraits: z.object({
    punctuality: z.string().describe('Punctuality rating (A-E).'),
    attitudeToWork: z.string().describe('Attitude to work rating (A-E).'),
    neatness: z.string().describe('Neatness and appearance rating (A-E).'),
    conduct: z.string().describe('Conduct and behavior rating (A-E).'),
    socializing: z.string().describe('Social skills rating (A-E).'),
    sportsActivities: z.string().describe('Sports and games participation rating (A-E).'),
    leadershipSkills: z.string().describe('Leadership skills rating (A-E).'),
    handiwork: z.string().describe('Handiwork/Vocational skills rating (A-E).'),
  }).describe('Ratings for various behavioral traits (A-Excellent, E-Poor).'),
});
export type GenerateAssessmentRemarksInput = z.infer<typeof GenerateAssessmentRemarksInputSchema>;

const GenerateAssessmentRemarksOutputSchema = z.object({
  remark: z.string().describe('A draft personalized and constructive assessment remark for the student.'),
});
export type GenerateAssessmentRemarksOutput = z.infer<typeof GenerateAssessmentRemarksOutputSchema>;

export async function generateAssessmentRemarks(input: GenerateAssessmentRemarksInput): Promise<GenerateAssessmentRemarksOutput> {
  return generateAssessmentRemarksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAssessmentRemarksPrompt',
  input: { schema: GenerateAssessmentRemarksInputSchema },
  output: { schema: GenerateAssessmentRemarksOutputSchema },
  prompt: `You are an AI assistant for a school Form Master. Your task is to generate a personalized and constructive assessment remark for a student based on their academic performance, attendance, and behavioral traits.

The remark should be professional, empathetic, highlight strengths, and suggest areas for improvement. Keep it concise, typically 2-4 sentences.

Here is the student's information:

Student Name: {{{studentName}}}
Class: {{{class}}}
Term: {{{term}}} - Session: {{{session}}}

--- Academic Performance ---
{{#each scores}}
- {{subject}}: Total: {{total}}, Grade: {{grade}}, Remark: {{remark}}
{{/each}}

--- Attendance ---
Days Present: {{{attendance.daysPresent}}} / Total School Days: {{{attendance.totalDays}}} (Days Absent: {{{attendance.daysAbsent}}})

--- Behavioral Traits (A=Excellent, E=Poor) ---
- Punctuality: {{{behavioralTraits.punctuality}}}
- Attitude to Work: {{{behavioralTraits.attitudeToWork}}}
- Neatness & Appearance: {{{behavioralTraits.neatness}}}
- Conduct & Behaviour: {{{behavioralTraits.conduct}}}
- Social Skills: {{{behavioralTraits.socializing}}}
- Sports & Games: {{{behavioralTraits.sportsActivities}}}
- Leadership Skills: {{{behavioralTraits.leadershipSkills}}}
- Handiwork / Vocational: {{{behavioralTraits.handiwork}}}

---

Draft a comprehensive and insightful remark for {{{studentName}}} that captures their overall performance and character.`,
});

const generateAssessmentRemarksFlow = ai.defineFlow(
  {
    name: 'generateAssessmentRemarksFlow',
    inputSchema: GenerateAssessmentRemarksInputSchema,
    outputSchema: GenerateAssessmentRemarksOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
