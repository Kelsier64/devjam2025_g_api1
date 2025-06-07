
'use server';
/**
 * @fileOverview Manages the conversational flow for collecting user profile information.
 *
 * - profileConversation - A function that handles the profile conversation turns.
 * - ProfileConversationInput - The input type for the profileConversation function.
 * - ProfileConversationOutput - The return type for the profileConversation function.
 */

import {ai} from '@/ai/genkit';
import {z}  from 'genkit';

const ProfileDataSchema = z.object({
  gpa: z.string().optional().describe("User's GPA, e.g., '3.8/4.0' or '90/100'"),
  testScores: z.string().optional().describe("User's standardized test scores, e.g., 'SAT: 1500, ACT: 34'"),
  extracurriculars: z.string().optional().describe("User's extracurricular activities"),
  skills: z.string().optional().describe("User's skills relevant to their studies"),
  preferences: z.string().optional().describe("User's school or department preferences and interests"),
});
export type ProfileDataSoFar = z.infer<typeof ProfileDataSchema>;

// Input schema is not exported as a value
const ProfileConversationInputSchema = z.object({
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    text: z.string(),
  })).describe("The history of the conversation so far."),
  profileSoFar: ProfileDataSchema.describe("The profile data collected and validated so far."),
});
export type ProfileConversationInput = z.infer<typeof ProfileConversationInputSchema>;

// Output schema is not exported as a value
const ProfileConversationOutputSchema = z.object({
  aiResponseText: z.string().describe("The AI's next message, which could be a question, a validation confirmation, or a re-prompt."),
  isUserInputValid: z.boolean().optional().describe("Indicates if the last user input was considered valid for the information being elicited. Only present if the last message in history was from the user."),
  updatedProfileField: z.string().optional().describe("If user input was valid, this is the key of the profile field that was updated (e.g., 'gpa', 'testScores')."),
  updatedProfileValue: z.string().optional().describe("If user input was valid, this is the new value for the updated profile field."),
  isProfileComplete: z.boolean().describe("Indicates if all required profile information has been collected and validated."),
});
export type ProfileConversationOutput = z.infer<typeof ProfileConversationOutputSchema>;


export async function profileConversation(input: ProfileConversationInput): Promise<ProfileConversationOutput> {
  return profileConversationFlow(input);
}

const PROFILE_FIELDS_ORDER: (keyof ProfileDataSoFar)[] = ['gpa', 'testScores', 'extracurriculars', 'skills', 'preferences'];

const initialQuestions: Record<keyof ProfileDataSoFar, string> = {
  gpa: "Let's start with your academic profile. What is your GPA? (e.g., 3.8/4.3 or 90/100)",
  testScores: "Great. Now, what are your standardized test scores? Please include the test name(s) and score(s). (e.g., SAT: 1500, ACT: 34)",
  extracurriculars: "Thanks! Could you tell me about your extracurricular activities? (e.g., Captain of debate team, volunteer work)",
  skills: "What skills do you possess relevant to your studies? (e.g., Python, Java, lab techniques, public speaking)",
  preferences: "Finally, what are your school or department preferences and interests? (e.g., Interested in West Coast universities, focus on AI research)",
};

const validationPrompts: Partial<Record<keyof ProfileDataSoFar, string>> = {
    gpa: "Hmm, that GPA doesn't look quite right. Could you provide it in a common format like '3.8/4.0' or '90 out of 100'?",
    testScores: "It seems like those test scores might be missing some details or a number. Could you try again, perhaps like 'SAT: 1500' or 'TOEFL: 110'?",
};


const prompt = ai.definePrompt({
  name: 'profileConversationPrompt',
  input: { schema: ProfileConversationInputSchema },
  output: { schema: ProfileConversationOutputSchema },
  prompt: `You are a friendly AI assistant helping a student build their academic profile for university applications.
Your goal is to collect the following pieces of information in this order: ${PROFILE_FIELDS_ORDER.join(', ')}.
Current profile data collected: {{{json profileSoFar}}}
Conversation history:
{{#each conversationHistory}}
{{role}}: {{text}}
{{/each}}

Instructions:
1.  Determine the next piece of information needed based on PROFILE_FIELDS_ORDER and what's already in 'profileSoFar'.
2.  If the conversation history is empty or the last message was from you (model), ask the question for the next needed piece of information. Use the initial questions provided below.
3.  If the last message was from the user:
    a.  Identify which profile field you were asking about.
    b.  Validate their response:
        *   For 'gpa': Check if it looks like a valid GPA (e.g., contains numbers, possibly a slash or 'out of'). It should generally be a number between 0-5 or 0-100, potentially with a scale like X/4.0 or Y/100.
        *   For 'testScores': Check if it mentions common test names and includes numbers.
        *   For 'extracurriculars', 'skills', 'preferences': These are more open-ended. A simple non-empty check is often enough, but ensure the answer is relevant to the question.
    c.  If the input is NOT valid for the field:
        Set 'isUserInputValid' to false.
        Set 'aiResponseText' to a polite re-prompt message (use validation prompts provided below or craft a similar one).
        Set 'isProfileComplete' to false.
        Do NOT update 'updatedProfileField' or 'updatedProfileValue'.
    d.  If the input IS valid:
        Set 'isUserInputValid' to true.
        Set 'updatedProfileField' to the key of the field collected (e.g., "gpa").
        Set 'updatedProfileValue' to the user's answer.
        Acknowledge the input briefly (e.g., "Got it.", "Thanks!").
        Then, determine if all profile fields are collected.
        If NOT all fields are collected, set 'aiResponseText' to the question for the *next* piece of information. Set 'isProfileComplete' to false.
        If ALL fields are collected, set 'aiResponseText' to a concluding message like "Great, that's all the information I need for your profile!". Set 'isProfileComplete' to true.
4.  Ensure 'aiResponseText' always contains your response to the user.

Initial Questions:
- gpa: "${initialQuestions.gpa}"
- testScores: "${initialQuestions.testScores}"
- extracurriculars: "${initialQuestions.extracurriculars}"
- skills: "${initialQuestions.skills}"
- preferences: "${initialQuestions.preferences}"

Validation Prompts (use if input is invalid):
- gpa: "${validationPrompts.gpa}"
- testScores: "${validationPrompts.testScores}"
- For others, if invalid, you can say: "That doesn't seem to quite answer the question. Could you please tell me about [the field name]?"

Profile fields to collect in order: gpa, testScores, extracurriculars, skills, preferences.
The profile is complete when all these fields have a value in 'profileSoFar' (after successful validation).
Focus on one piece of information at a time.
If the profile is already complete based on 'profileSoFar' at the start of this turn, 'aiResponseText' should be "It looks like I already have your complete profile!", and 'isProfileComplete' should be true.
`,
});


const profileConversationFlow = ai.defineFlow(
  {
    name: 'profileConversationFlow',
    inputSchema: ProfileConversationInputSchema,
    outputSchema: ProfileConversationOutputSchema,
  },
  async (input) => {
    // Determine the current field being asked for or the next field to ask for
    let currentFieldKey: keyof ProfileDataSoFar | undefined = undefined;
    for (const field of PROFILE_FIELDS_ORDER) {
      if (!input.profileSoFar[field]) {
        currentFieldKey = field;
        break;
      }
    }

    if (!currentFieldKey && Object.keys(input.profileSoFar).length === PROFILE_FIELDS_ORDER.length && Object.values(input.profileSoFar).every(v => v !== undefined && v !== '')) {
        // Profile is already complete if all fields are filled
        return {
            aiResponseText: "It looks like I already have all your profile details. Proceeding to the next step!",
            isProfileComplete: true,
        };
    }
    
    // If conversation history is empty, LLM should ask the first question.
    // Or if last message was AI, LLM asks next question.
    // If last message was user, LLM validates and then asks next or concludes.
    const { output } = await prompt(input);
    
    if (!output) {
        // Fallback or error handling if LLM doesn't provide output
        const nextFieldToAsk = PROFILE_FIELDS_ORDER.find(f => !input.profileSoFar[f]);
        const fallbackQuestion = nextFieldToAsk ? initialQuestions[nextFieldToAsk] : "Sorry, I'm having a bit of trouble. Could we try that again?";
        return {
            aiResponseText: fallbackQuestion,
            isProfileComplete: false,
            isUserInputValid: false,
        };
    }
    return output;
  }
);
    
