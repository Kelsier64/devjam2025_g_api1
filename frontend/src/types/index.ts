
import type { LucideIcon } from 'lucide-react';
import type { EvaluateDepartmentRankingsOutput } from '@/ai/flows/evaluate-department-rankings';
import type { ApplicationSnippetsOutput as AppSnippetsOutput } from '@/ai/flows/generate-application-snippets-flow';

export interface ProfileData {
  details: string; 
}

export type RankedDepartment = EvaluateDepartmentRankingsOutput extends (infer R)[] ? R : never;

export type ApplicationSnippets = AppSnippetsOutput;


export interface MockDeadlineData {
  departmentName: string; 
  applicationOpen: Date;
  applicationDeadline: Date;
}

export interface ChartDeadlineData {
  name:string; 
  universityName: string;
  departmentName: string;
  start: number; 
  open: number; 
  deadline: number; 
}

export interface ConversationEntry {
  type: 'ai' | 'user'; 
  text: string;
}

export interface LLMMessage {
    role: 'user' | 'model';
    text: string;
}
    
