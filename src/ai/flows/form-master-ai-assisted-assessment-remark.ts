'use server';
/**
 * @fileOverview A Genkit flow for generating AI-assisted assessment remarks for students.
 *
 * - generateFormMasterRemark - A function that generates a draft remark based on student data.
 * - FormMasterAIAssistedAssessmentRemarkInput - The input type for the generateFormMasterRemark function.
 * - FormMasterAIAssistedAssessmentRemarkOutput - The return type for the generateFormMasterRemark function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FormMasterAIAssistedAssessmentRemarkInputSchema = z.object({
  studentName: z.string().describe("The student's full name."),
  termName: z.string().describe("The name of the current term (e.g., 'First', 'Second')."),
  academicSessionName: z.string().describe("The name of the academic session (e.g., '2024/2025')."),
  classLevel: z.string().describe("The student's class level (e.g., 'JSS1')."),
  behavioralRatings: z.object({
    punctuality: z.string().optional().describe("Student's punctuality rating (A-E)."),
    attitudeToWork: z.string().optional().describe("Student's attitude to work rating (A-E)."),
    neatness: z.string().optional().describe("Student's neatness rating (A-E)."),
    conduct: z.string().optional().describe("Student's conduct rating (A-E)."),
    socializing: z.string().optional().describe("Student's socializing rating (A-E)."),
    sportsActivities: z.string().optional().describe("Student's sports activities rating (A-E)."),
    leadershipSkills: z.string().optional().describe("Student's leadership skills rating (A-E)."),
    handiwork: z.string().optional().describe("Student's handiwork rating (A-E)."),
  }).describe("A set of behavioral trait ratings for the student (A-E)."),
  totalDays: z.number().optional().describe("Total number of school days in the term."),
  daysPresent: z.number().optional().describe("Number of days the student was present."),
  overallAverageScore: z.number().optional().describe("The student's overall average score for the term."),
  overallPosition: z.number().optional().describe("The student's overall position in the class for the term."),
  subjectPerformanceSummary: z.string().optional().describe("A summary of the student's performance in individual subjects, e.g., 'Mathematics: B2 (Very Good), English: C4 (Credit)'"),
});
export type FormMasterAIAssistedAssessmentRemarkInput = z.infer<typeof FormMasterAIAssistedAssessmentRemarkInputSchema>;

const FormMasterAIAssistedAssessmentRemarkOutputSchema = z.object({
  remark: z.string().describe("The generated draft remark for the student's term assessment."),
});
export type FormMasterAIAssistedAssessmentRemarkOutput = z.infer<typeof FormMasterAIAssistedAssessmentRemarkOutputSchema>;

export async function generateFormMasterRemark(input: FormMasterAIAssistedAssessmentRemarkInput): Promise<FormMasterAIAssistedAssessmentRemarkOutput> {
  return formMasterAIAssistedAssessmentRemarkFlow(input);
}

const formMasterRemarkPrompt = ai.definePrompt({
  name: 'formMasterRemarkPrompt',
  input: {schema: FormMasterAIAssistedAssessmentRemarkInputSchema},
  output: {schema: FormMasterAIAssistedAssessmentRemarkOutputSchema},
  prompt: `You are an experienced and insightful Form Master tasked with writing a comprehensive termly assessment remark for a student. Your goal is to provide constructive and encouraging feedback, highlighting strengths and identifying areas for improvement, all while maintaining a professional and supportive tone.

Here is the student's information for the {{termName}} Term of the {{academicSessionName}} academic session in {{classLevel}}:

Student Name: {{{studentName}}}

--- Behavioral Ratings ---
{{#if behavioralRatings.punctuality}}Punctuality: {{{behavioralRatings.punctuality}}}
{{/if}}{{#if behavioralRatings.attitudeToWork}}Attitude to Work: {{{behavioralRatings.attitudeToWork}}}
{{/if}}{{#if behavioralRatings.neatness}}Neatness & Appearance: {{{behavioralRatings.neatness}}}
{{/if}}{{#if behavioralRatings.conduct}}Conduct & Behaviour: {{{behavioralRatings.conduct}}}
{{/if}}{{#if behavioralRatings.socializing}}Social Skills: {{{behavioralRatings.socializing}}}
{{/if}}{{#if behavioralRatings.sportsActivities}}Sports & Games: {{{behavioralRatings.sportsActivities}}}
{{/if}}{{#if behavioralRatings.leadershipSkills}}Leadership Skills: {{{behavioralRatings.leadershipSkills}}}
{{/if}}{{#if behavioralRatings.handiwork}}Handiwork / Vocational: {{{behavioralRatings.handiwork}}}
{{/if}}
--- Attendance ---
{{#if totalDays}}Total School Days: {{{totalDays}}}
{{/if}}{{#if daysPresent}}Days Present: {{{daysPresent}}}
{{/if}}
--- Academic Performance ---
{{#if overallAverageScore}}Overall Average Score: {{{overallAverageScore}}}%
{{/if}}{{#if overallPosition}}Overall Class Position: {{{overallPosition}}}
{{/if}}{{#if subjectPerformanceSummary}}Subject Performance Summary:
{{{subjectPerformanceSummary}}}
{{/if}}

Please draft a concise and professional remark that summarizes the student's overall performance and conduct for the term. The remark should:
1. Start with an overall positive or neutral statement.
2. Comment on key behavioral aspects, highlighting strengths and suggesting areas for growth.
3. Briefly touch upon academic performance, acknowledging achievements or noting where more effort is needed.
4. Include a concluding encouraging statement.
5. Avoid overly generic phrases and ensure the remark sounds like it was written by a human Form Master.
6. The remark should be between 50 and 150 words.`,
});

const formMasterAIAssistedAssessmentRemarkFlow = ai.defineFlow(
  {
    name: 'formMasterAIAssistedAssessmentRemarkFlow',
    inputSchema: FormMasterAIAssistedAssessmentRemarkInputSchema,
    outputSchema: FormMasterAIAssistedAssessmentRemarkOutputSchema,
  },
  async (input) => {
    const {output} = await formMasterRemarkPrompt(input);
    return output!;
  }
);
