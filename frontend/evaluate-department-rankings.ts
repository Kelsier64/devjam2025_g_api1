
// This is a server-side file.
'use server';

/**
 * @fileOverview Evaluates recommended school departments for a user based on their profile, ranks them, and explains the reasons.
 *
 * - evaluateDepartmentRankings - A function that handles the department ranking process.
 * - EvaluateDepartmentRankingsInput - The input type for the evaluateDepartmentRankings function.
 * - EvaluateDepartmentRankingsOutput - The return type for the evaluateDepartmentRankings function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateDepartmentRankingsInputSchema = z.object({
  profile: z.string().describe('The user profile information including GPA, standardized test scores, extracurricular activities, skills, and preferences.'),
  departments: z.array(z.string()).describe('An array of general school department names the user is interested in evaluating.'),
});
export type EvaluateDepartmentRankingsInput = z.infer<typeof EvaluateDepartmentRankingsInputSchema>;

const RankedDepartmentSchema = z.object({
  universityName: z.string().describe('The name of the suggested university.'),
  departmentName: z.string().describe('The common name of the department at the university (e.g., "Computer Science", "Biology").'),
  ranking: z.number().describe('The rating of the university department on a scale of 0.0 to 10.0 (higher is better), with one decimal place. This reflects the fit for the user.'),
  reason: z.string().describe('The reason for the rating, considering the user profile and the specific university department.'),
});

const EvaluateDepartmentRankingsOutputSchema = z.array(RankedDepartmentSchema).describe('An array of rated university departments with explanations, sorted from highest to lowest rating.');
export type EvaluateDepartmentRankingsOutput = z.infer<typeof EvaluateDepartmentRankingsOutputSchema>;

export async function evaluateDepartmentRankings(input: EvaluateDepartmentRankingsInput): Promise<EvaluateDepartmentRankingsOutput> {
  return evaluateDepartmentRankingsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateDepartmentRankingsPrompt',
  input: {schema: EvaluateDepartmentRankingsInputSchema},
  output: {schema: EvaluateDepartmentRankingsOutputSchema},
  prompt: `You are an AI assistant that evaluates and rates specific university departments based on a user's profile and their general department interests.

  User Profile: {{{profile}}}
  General Department Interests: {{#each departments}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Based on the user's profile and their general department interests, suggest specific university departments (e.g., "Stanford University - Computer Science", "UC Berkeley - Electrical Engineering").
  
  For each suggested university department, provide a rating on a scale of 0.0 to 10.0, where a higher score indicates a better fit for the user. The rating should include one decimal place.
  
  Provide a clear reason for each rating, considering the user profile and the specific university department.
  
  For the 'departmentName' field, use a common department name like "Computer Science", "Mechanical Engineering", "Biology", etc. This helps in matching with other system data.
  
  Ensure the output format is strictly a JSON array of RankedDepartment objects, sorted by 'ranking' from highest to lowest.

  Example:
  [
    {
      "universityName": "Stanford University",
      "departmentName": "Computer Science",
      "ranking": 9.5,
      "reason": "Excellent match due to user's strong programming skills and stated interest in AI research, aligning perfectly with Stanford's world-renowned CS program and its cutting-edge AI labs."
    },
    {
      "universityName": "University of California, Berkeley",
      "departmentName": "Electrical Engineering",
      "ranking": 8.2,
      "reason": "Strong match. User's aptitude in math and science fits well with Berkeley's rigorous EECS department. While broader than just software, it offers compelling hardware and systems tracks relevant to user's skills."
    },
    {
      "universityName": "Massachusetts Institute of Technology (MIT)",
      "departmentName": "Computer Science",
      "ranking": 9.3,
      "reason": "Very strong fit. MIT's CS program is top-tier, and user's profile suggests they can handle the challenging curriculum. Their extracurriculars show leadership, which MIT values."
    }
  ]
  `,
});

const evaluateDepartmentRankingsFlow = ai.defineFlow(
  {
    name: 'evaluateDepartmentRankingsFlow',
    inputSchema: EvaluateDepartmentRankingsInputSchema,
    outputSchema: EvaluateDepartmentRankingsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // The AI is instructed to sort, but we can double-check or re-sort here if necessary.
    // For now, we trust the AI's sorting as per the prompt.
    return output!;
  }
);
