
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';
import type { ConversationEntry } from '@/types';
import { cn } from '@/lib/utils';

interface ConversationalProfileInputProps {
  currentQuestionText: string; // The current question text from the AI
  onAnswerSubmit: (answer: string) => void;
  isLoading: boolean;
  history: ConversationEntry[];
  cardClassName?: string;
}

export function ConversationalProfileInput({ currentQuestionText, onAnswerSubmit, isLoading, history, cardClassName }: ConversationalProfileInputProps) {
  const [currentAnswer, setCurrentAnswer] = React.useState('');
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentAnswer.trim() && !isLoading) {
      onAnswerSubmit(currentAnswer.trim());
      setCurrentAnswer('');
    }
  };

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [history]);

  const placeholderText = isLoading && currentAnswer === '' ? "Waiting for AI..." : "Type your answer...";

  return (
    <Card className={cn("w-full max-w-3xl", cardClassName)}>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Your Academic Profile</CardTitle>
        <CardDescription>Please answer the questions below to build your profile.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[300px] w-full rounded-md border p-4" ref={scrollAreaRef}>
          <div className="space-y-3">
            {history.map((entry, index) => (
              <div
                key={index}
                className={cn(
                  "flex w-full max-w-[85%] flex-col gap-1 rounded-lg px-3 py-2 text-sm",
                  entry.type === 'user' ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                <p className="whitespace-pre-wrap">{entry.text}</p>
              </div>
            ))}
             {isLoading && history.length > 0 && history.slice(-1)[0].type === 'user' && (
              <div className="flex items-center space-x-2 p-2 bg-muted rounded-lg max-w-[85%]">
                <Icons.Spinner className="h-4 w-4 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">AI is thinking...</p>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            id="conversational-input"
            type="text"
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder={placeholderText}
            disabled={isLoading || !currentQuestionText || currentQuestionText === "Thinking..."}
            aria-label="Your answer"
            className="text-base"
          />
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !currentAnswer.trim() || !currentQuestionText || currentQuestionText === "Thinking..."}
          >
            {isLoading ? <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send Answer
            <Icons.ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Answer each question to help us build a complete profile for evaluation.
        </p>
      </CardFooter>
    </Card>
  );
}
    