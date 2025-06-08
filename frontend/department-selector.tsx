
'use client';

import * as React from 'react';
import type { RankedDepartment } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DepartmentSelectorProps {
  rankedDepartments: RankedDepartment[];
  onConfirmSelection: (selected: RankedDepartment[]) => void;
  isLoading?: boolean;
  cardClassName?: string;
}

export function DepartmentSelector({ rankedDepartments, onConfirmSelection, isLoading = false, cardClassName }: DepartmentSelectorProps) {
  const [selectedDepartmentIds, setSelectedDepartmentIds] = React.useState<Set<string>>(new Set());

  const getDepartmentId = (dept: RankedDepartment): string => {
    return `${dept.universityName}-${dept.departmentName}`;
  };

  const handleCheckboxChange = (department: RankedDepartment, checked: boolean) => {
    const id = getDepartmentId(department);
    setSelectedDepartmentIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    const selected = rankedDepartments.filter(dept => selectedDepartmentIds.has(getDepartmentId(dept)));
    onConfirmSelection(selected);
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full max-w-4xl", cardClassName)}>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Evaluating Departments...</CardTitle>
          <CardDescription>Our AI is analyzing your profile to suggest the best-fit university departments. This might take a moment.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Icons.Spinner className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Analyzing...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!rankedDepartments || rankedDepartments.length === 0) {
     return (
      <Card className={cn("w-full max-w-4xl", cardClassName)}>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">No University Departments Evaluated</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64 text-center">
          <Icons.AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-muted-foreground">
            We couldn't evaluate university departments based on the provided profile.
            Please try submitting your profile again or contact support if the issue persists.
          </p>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className={cn("w-full max-w-4xl", cardClassName)}>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">University Department Evaluation Results</CardTitle>
        <CardDescription>
          Based on your profile, here are the AI-evaluated university departments. Review the ratings and reasons, then select the ones you're interested in for deadline tracking. Ratings are from 0.0 to 10.0 (higher is better).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {rankedDepartments.sort((a,b) => b.ranking - a.ranking).map((dept, index) => {
              const deptId = getDepartmentId(dept);
              const displayName = `${dept.universityName} - ${dept.departmentName}`;
              return (
                <div key={deptId}>
                  <Card className="bg-background hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Checkbox
                            id={`dept-${deptId}`}
                            checked={selectedDepartmentIds.has(deptId)}
                            onCheckedChange={(checked) => handleCheckboxChange(dept, !!checked)}
                          />
                          <label htmlFor={`dept-${deptId}`} className="font-headline text-lg cursor-pointer">{displayName}</label>
                        </div>
                        <Badge 
                          variant={dept.ranking >= 8.0 ? 'default' : (dept.ranking >= 6.0 ? 'default' : 'secondary')}
                          className={cn(
                            dept.ranking >= 8.0 ? 'bg-accent text-accent-foreground' : 
                            (dept.ranking >= 6.0 ? 'bg-primary text-primary-foreground' : '')
                          )}
                        >
                          Rating: {dept.ranking.toFixed(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{dept.reason}</p>
                    </CardContent>
                  </Card>
                  {index < rankedDepartments.length - 1 && <Separator className="my-4"/>}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} className="w-full" disabled={selectedDepartmentIds.size === 0}>
          View Application Deadlines
          <Icons.ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
