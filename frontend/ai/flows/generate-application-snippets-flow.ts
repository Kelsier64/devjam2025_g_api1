
'use server';
/**
 * @fileOverview Generates tailored advice for application form sections based on user profile and target program.
 *
 * - generateApplicationSnippets - A function that handles snippet generation.
 * - GenerateApplicationSnippetsInput - The input type.
 * - ApplicationSnippetsOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateApplicationSnippetsInputSchema = z.object({
  userProfile: z.string().describe("The user's comprehensive academic and extracurricular profile."),
  universityName: z.string().describe("The name of the university for the application."),
  departmentName: z.string().describe("The name of the department or program at the university."),
});
export type GenerateApplicationSnippetsInput = z.infer<typeof GenerateApplicationSnippetsInputSchema>;

const ApplicationSnippetsOutputSchema = z.object({
  personalStatementFocus: z.string().describe("Suggestions on what aspects of their profile to emphasize in their personal statement for this specific program."),
  whyThisProgram: z.string().describe("Key points on how to articulate why they are interested in this particular program at this university, drawing connections to their profile."),
  relevantSkillsHighlight: z.string().describe("Advice on which of their skills are most relevant and how to best showcase them for this application."),
  careerGoalsAlignment: z.string().describe("Tips on connecting their stated career goals to what this program offers."),
  potentialQuestionsToPrepare: z.string().describe("Suggests 1-2 potential interview questions they might want to prepare for, specific to this program and their profile."),
});
export type ApplicationSnippetsOutput = z.infer<typeof ApplicationSnippetsOutputSchema>;

export async function generateApplicationSnippets(input: GenerateApplicationSnippetsInput): Promise<ApplicationSnippetsOutput> {
  return generateApplicationSnippetsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateApplicationSnippetsPrompt',
  input: {schema: GenerateApplicationSnippetsInputSchema},
  output: {schema: ApplicationSnippetsOutputSchema},
  prompt: `You are an expert academic advisor. Based on the provided user profile, university, and department, generate concise and actionable advice to help the user fill out their application form.

User Profile:
{{{userProfile}}}

Target University: {{{universityName}}}
Target Department/Program: {{{departmentName}}}

Provide specific, tailored suggestions for the following sections:
1.  Personal Statement Focus: What unique aspects of their profile should they highlight? How can they connect their experiences to the program's strengths or faculty research?
2.  Why This Program: How can they best articulate their interest in *this specific* program at *this university*? What unique features of the program (e.g., curriculum, research areas, labs, faculty) can they mention and tie back to their profile?
3.  Relevant Skills Highlight: Which of their skills (academic, technical, soft) are most pertinent? How can they provide evidence for these skills in their application?
4.  CareerGoals Alignment: How can they convincingly link their career aspirations to what this specific program offers?
5.  Potential Questions to Prepare: Suggest 1-2 insightful questions they might encounter in an interview or need to address implicitly in their essays, specific to applying to {{{departmentName}}} at {{{universityName}}} with their background.

Ensure your advice is practical and directly helps the user craft a stronger application for {{{universityName}}}'s {{{departmentName}}} program.
`,
});

const generateApplicationSnippetsFlow = ai.defineFlow(
  {
    name: 'generateApplicationSnippetsFlow',
    inputSchema: GenerateApplicationSnippetsInputSchema,
    outputSchema: ApplicationSnippetsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

