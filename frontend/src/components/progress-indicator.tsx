
'use client';

import * as React from 'react';
import type { ProgressStep } from '@/types';
import { cn } from '@/lib/utils';
// Icons import removed as it's no longer used for default
// import { Icons } from '@/components/icons'; 

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStepIndex: number;
}

export function ProgressIndicator({ steps, currentStepIndex }: ProgressIndicatorProps) {
  return (
    <div className="mb-8 w-full max-w-2xl">
      <ol className="flex items-start w-full">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          // IconComponent logic removed
          // const IconComponent = step.icon || Icons.ChevronRight; 

          return (
            <React.Fragment key={step.name}>
              <li
                className={cn(
                  "flex flex-col items-center w-1/3", 
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-all duration-300 ease-in-out",
                    isActive ? "bg-primary text-primary-foreground scale-110 shadow-lg ring-2 ring-background ring-offset-2 ring-offset-primary" : "",
                    isCompleted ? "bg-accent text-accent-foreground" : "",
                    !isActive && !isCompleted ? "bg-muted text-muted-foreground" : ""
                  )}
                >
                  {/* IconComponent rendering removed */}
                  {/* <IconComponent className="w-5 h-5" /> */}
                </span>
                <div className="mt-2 text-center w-full px-1">
                  <span className={cn(
                    "text-xs font-medium whitespace-normal break-words",
                    isActive ? "text-primary font-semibold" : "",
                    isCompleted ? "text-accent" : "text-muted-foreground",
                    !isActive && !isCompleted ? "text-muted-foreground" : ""
                  )}>
                    {step.name}
                  </span>
                </div>
              </li>
              {index < steps.length - 1 && (
                <li className="flex-1 pt-5"> 
                  <div className={cn(
                      "w-full h-1 rounded",
                      (index < currentStepIndex) ? "bg-accent" : "bg-border"
                   )} />
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </div>
  );
}
