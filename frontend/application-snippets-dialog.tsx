
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ApplicationSnippets } from '@/types';
import { Icons } from '@/components/icons';
import { Separator } from './ui/separator';

interface ApplicationSnippetsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  snippets: ApplicationSnippets | null;
  universityName: string;
  departmentName: string;
  isLoading: boolean;
}

export function ApplicationSnippetsDialog({
  isOpen,
  onOpenChange,
  snippets,
  universityName,
  departmentName,
  isLoading,
}: ApplicationSnippetsDialogProps) {
  const renderSnippetSection = (title: string, content?: string) => {
    if (!content) return null;
    return (
      <div className="mb-4">
        <h3 className="text-md font-semibold text-primary mb-1">{title}</h3>
        <p className="text-sm text-foreground whitespace-pre-wrap bg-muted p-3 rounded-md">{content}</p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl">
            Application Pointers for <span className="text-primary">{universityName} - {departmentName}</span>
          </DialogTitle>
          <DialogDescription>
            Here's some AI-generated advice based on your profile to help with your application.
          </DialogDescription>
        </DialogHeader>
        <Separator className="my-2"/>
        <ScrollArea className="flex-grow pr-2"> {/* Added pr-2 for scrollbar spacing */}
          <div className="py-1">
            {isLoading && !snippets && (
              <div className="flex flex-col items-center justify-center h-64">
                <Icons.Spinner className="h-10 w-10 animate-spin text-primary mb-3" />
                <p className="text-muted-foreground">Generating tailored advice...</p>
              </div>
            )}
            {!isLoading && !snippets && (
                 <div className="flex flex-col items-center justify-center h-64">
                    <Icons.AlertTriangle className="h-10 w-10 text-destructive mb-3" />
                    <p className="text-muted-foreground text-center">Could not load application advice. <br/> Please try closing this dialog and clicking the bar again.</p>
                 </div>
            )}
            {snippets && (
              <>
                {renderSnippetSection('Personal Statement Focus', snippets.personalStatementFocus)}
                {renderSnippetSection('Why This Program', snippets.whyThisProgram)}
                {renderSnippetSection('Relevant Skills to Highlight', snippets.relevantSkillsHighlight)}
                {renderSnippetSection('Aligning with Career Goals', snippets.careerGoalsAlignment)}
                {renderSnippetSection('Potential Questions to Prepare', snippets.potentialQuestionsToPrepare)}
              </>
            )}
          </div>
        </ScrollArea>
        <Separator className="my-2"/>
        <DialogFooter className="pt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
