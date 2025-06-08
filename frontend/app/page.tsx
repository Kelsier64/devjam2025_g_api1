
'use client';

import * as React from 'react';
import Image from 'next/image';
import type { ProfileData, RankedDepartment, ConversationEntry, ApplicationSnippets } from '@/types';
import { evaluateDepartmentRankings, type EvaluateDepartmentRankingsInput } from '@/ai/flows/evaluate-department-rankings';
import { profileConversation, type ProfileConversationInput, type ProfileConversationOutput, type ProfileDataSoFar } from '@/ai/flows/profile-conversation-flow';
import { generateApplicationSnippets, type GenerateApplicationSnippetsInput } from '@/ai/flows/generate-application-snippets-flow';
import { PREDEFINED_DEPARTMENTS } from '@/config/appConfig';

import { Icons } from '@/components/icons';
import { ConversationalProfileInput } from '@/components/conversational-profile-input';
import { DepartmentSelector } from '@/components/department-selector';
import { DeadlineChart } from '@/components/deadline-chart';
import { ApplicationSnippetsDialog } from '@/components/application-snippets-dialog';
import { useToast } from "@/hooks/use-toast"
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


type WorkflowStage = 'profile' | 'evaluation' | 'deadlines';


export default function HomePage() {
  const [currentStage, setCurrentStage] = React.useState<WorkflowStage>('profile');
  const [userProfile, setUserProfile] = React.useState<ProfileData | null>(null);
  const [rankedDepartments, setRankedDepartments] = React.useState<RankedDepartment[]>([]);
  const [selectedDepartmentsForChart, setSelectedDepartmentsForChart] = React.useState<RankedDepartment[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const { toast } = useToast();

  const [profileAnswers, setProfileAnswers] = React.useState<ProfileDataSoFar>({});
  const [conversationHistory, setConversationHistory] = React.useState<ConversationEntry[]>([]);
  const [isProfileComplete, setIsProfileComplete] = React.useState<boolean>(false);
  const [currentAiQuestion, setCurrentAiQuestion] = React.useState<string>("");

  const [isSnippetsDialogOpen, setIsSnippetsDialogOpen] = React.useState<boolean>(false);
  const [currentSnippets, setCurrentSnippets] = React.useState<ApplicationSnippets | null>(null);
  const [selectedDeptForSnippets, setSelectedDeptForSnippets] = React.useState<{universityName: string, departmentName: string} | null>(null);


  React.useEffect(() => {
    if (currentStage === 'profile' && conversationHistory.length === 0 && !isProfileComplete && !isLoading) {
      setIsLoading(true);
      const initialInput: ProfileConversationInput = {
        conversationHistory: [],
        profileSoFar: {},
      };
      profileConversation(initialInput)
        .then((response) => {
          setConversationHistory([{ type: 'ai', text: response.aiResponseText }]);
          setCurrentAiQuestion(response.aiResponseText);
        })
        .catch(error => {
          console.error("Error starting conversation:", error);
          toast({ title: "Conversation Error", description: "Could not start the conversation with the AI.", variant: "destructive" });
          setConversationHistory([{ type: 'ai', text: "Sorry, I'm having trouble starting our conversation. Please try refreshing." }]);
        })
        .finally(() => setIsLoading(false));
    }
  }, [currentStage, conversationHistory.length, isProfileComplete, isLoading, toast]);


  const handleAIProfileEvaluation = async (finalAnswers: ProfileDataSoFar) => {
    const profileDetails = `GPA: ${finalAnswers.gpa || 'N/A'}\nTest Scores: ${finalAnswers.testScores || 'N/A'}\nExtracurricular Activities: ${finalAnswers.extracurriculars || 'N/A'}\nSkills: ${finalAnswers.skills || 'N/A'}\nPreferences & Interests: ${finalAnswers.preferences || 'N/A'}`;
    const profileData: ProfileData = { details: profileDetails };
    setUserProfile(profileData);
    setIsLoading(true); 

    try {
      const aiInput: EvaluateDepartmentRankingsInput = {
        profile: profileData.details,
        departments: PREDEFINED_DEPARTMENTS,
      };
      const result = await evaluateDepartmentRankings(aiInput);
      if (result && result.length > 0) {
        setRankedDepartments(result);
        toast({
          title: "Evaluation Complete",
          description: "Departments have been evaluated based on your profile.",
          variant: "default",
        });
      } else {
        setRankedDepartments([]);
        toast({
          title: "Evaluation Note",
          description: "AI completed evaluation, but no specific rankings were returned. You can proceed or refine your profile if needed.",
          variant: "default",
        });
      }
      setCurrentStage('evaluation'); 
    } catch (error) {
      console.error("Error evaluating departments:", error);
      setRankedDepartments([]);
      toast({
        title: "Evaluation Error",
        description: "An error occurred while evaluating departments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSubmit = async (userAnswer: string) => {
    if (!userAnswer.trim()) return;

    const newHistory: ConversationEntry[] = [...conversationHistory, { type: 'user', text: userAnswer }];
    setConversationHistory(newHistory);
    setIsLoading(true);
    setCurrentAiQuestion("Thinking..."); 

    try {
      const llmInput: ProfileConversationInput = {
        conversationHistory: newHistory.map(entry => ({
          role: entry.type === 'ai' ? 'model' : 'user', 
          text: entry.text
        })),
        profileSoFar: profileAnswers,
      };
      const response: ProfileConversationOutput = await profileConversation(llmInput);

      const updatedHistoryWithAI: ConversationEntry[] = [...newHistory, { type: 'ai', text: response.aiResponseText }];
      setConversationHistory(updatedHistoryWithAI);
      setCurrentAiQuestion(response.aiResponseText);
      
      let newProfileAnswers = { ...profileAnswers };
      if (response.isUserInputValid && response.updatedProfileField && response.updatedProfileValue) {
        newProfileAnswers = {
          ...profileAnswers,
          [response.updatedProfileField]: response.updatedProfileValue,
        };
        setProfileAnswers(newProfileAnswers);
      }

      if (response.isProfileComplete) {
        setIsProfileComplete(true);
        await handleAIProfileEvaluation(newProfileAnswers); 
      } else {
        setIsLoading(false); 
      }

    } catch (error) {
      console.error("Error in profile conversation flow:", error);
      toast({ title: "Conversation Error", description: "There was an issue processing your answer.", variant: "destructive" });
      const errorHistory: ConversationEntry[] = [...newHistory, { type: 'ai', text: "Sorry, I had trouble understanding that. Could you try again?" }];
      setConversationHistory(errorHistory);
      setCurrentAiQuestion("Sorry, I had trouble understanding that. Could you try again?");
      setIsLoading(false);
    }
  };


  const handleDepartmentSelectionConfirm = (selected: RankedDepartment[]) => {
    setSelectedDepartmentsForChart(selected);
    setCurrentStage('deadlines');
    toast({
      title: "Departments Selected",
      description: "Proceeding to view application deadlines.",
    });
  };

  const handleDeadlineBarClick = async (department: { universityName: string, departmentName: string }) => {
    if (!userProfile?.details) {
      toast({ title: "Profile Error", description: "User profile details are missing.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setCurrentSnippets(null);
    setSelectedDeptForSnippets(department);
    setIsSnippetsDialogOpen(true); 

    try {
      const input: GenerateApplicationSnippetsInput = {
        userProfile: userProfile.details,
        universityName: department.universityName,
        departmentName: department.departmentName,
      };
      const snippets = await generateApplicationSnippets(input);
      setCurrentSnippets(snippets);
    } catch (error) {
      console.error("Error generating application snippets:", error);
      toast({ title: "Snippet Generation Error", description: "Could not generate application advice. Please try again.", variant: "destructive" });
      // Optionally close the dialog or show an error message within it
      // setIsSnippetsDialogOpen(false); 
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    setCurrentStage('profile');
    setUserProfile(null);
    setRankedDepartments([]);
    setSelectedDepartmentsForChart([]);
    setIsLoading(false);
    setProfileAnswers({});
    setConversationHistory([]);
    setIsProfileComplete(false);
    setCurrentAiQuestion("");
    setIsSnippetsDialogOpen(false);
    setCurrentSnippets(null);
    setSelectedDeptForSnippets(null);

     setTimeout(() => {
        if (!isLoading) { 
            setIsLoading(true);
            profileConversation({ conversationHistory: [], profileSoFar: {} })
                .then((response) => {
                    setConversationHistory([{ type: 'ai', text: response.aiResponseText }]);
                    setCurrentAiQuestion(response.aiResponseText);
                })
                .catch(error => {
                    console.error("Error starting conversation on reset:", error);
                    setConversationHistory([{ type: 'ai', text: "Let's try starting over. What is your GPA?" }]);
                    setCurrentAiQuestion("Let's try starting over. What is your GPA?");
                })
                .finally(() => setIsLoading(false));
        }
    }, 0);

    toast({
      title: "Process Reset",
      description: "Let's start over. Please provide your profile details.",
    });
  };


  return (
    <div className="flex min-h-screen flex-col items-center bg-background text-foreground">
      <header className="w-full bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <Image src="/icon.png" alt="申寶 SAMBOU Icon" width={30} height={30} data-ai-hint="letter S logo" />
            <div>
              <h1 className="text-lg font-headline font-semibold text-primary">
                申寶 SAMBOU
              </h1>
              <p className="text-xs text-muted-foreground">搞定申請大小事，不用再戰第二次</p>
            </div>
          </div>
           {(currentStage !== 'profile' || conversationHistory.length > 1 || Object.keys(profileAnswers).length > 0) && (
            <Button variant="outline" onClick={handleReset} size="sm">
              Start Over
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto flex w-full flex-grow flex-col items-center p-4 pt-8 md:p-8">
        
        {currentStage === 'profile' && !isProfileComplete && (
          <ConversationalProfileInput
            currentQuestionText={currentAiQuestion}
            onAnswerSubmit={handleAnswerSubmit}
            isLoading={isLoading}
            history={conversationHistory}
            cardClassName="shadow-lg"
          />
        )}
        
        {currentStage === 'profile' && isProfileComplete && isLoading && (
          <Card className="w-full max-w-3xl shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-center">Evaluating Departments</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Icons.Spinner className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Please wait while we analyze your profile...</p>
            </CardContent>
          </Card>
        )}

        {currentStage === 'evaluation' && (
          <DepartmentSelector 
            rankedDepartments={rankedDepartments} 
            onConfirmSelection={handleDepartmentSelectionConfirm}
            isLoading={isLoading && rankedDepartments.length === 0} 
            cardClassName="shadow-lg"
          />
        )}

        {currentStage === 'deadlines' && (
          <DeadlineChart 
            selectedDepartments={selectedDepartmentsForChart} 
            cardClassName="shadow-lg"
            onBarClick={handleDeadlineBarClick}
            userProfileDetails={userProfile?.details}
          />
        )}
      </main>
      <footer className="w-full py-4 text-center text-sm text-muted-foreground border-t border-border mt-auto">
        © {new Date().getFullYear()} 申寶 SAMBOU. All rights reserved.
      </footer>

      {selectedDeptForSnippets && (
        <ApplicationSnippetsDialog
          isOpen={isSnippetsDialogOpen}
          onOpenChange={setIsSnippetsDialogOpen}
          snippets={currentSnippets}
          universityName={selectedDeptForSnippets.universityName}
          departmentName={selectedDeptForSnippets.departmentName}
          isLoading={isLoading && currentSnippets === null}
        />
      )}
    </div>
  );
}
    
