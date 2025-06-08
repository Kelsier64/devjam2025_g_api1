
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import type { RankedDepartment, ChartDeadlineData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PREDEFINED_DEPARTMENTS, MOCK_DEADLINES } from '@/config/appConfig';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DeadlineChartProps {
  selectedDepartments: RankedDepartment[];
  cardClassName?: string;
  userProfileDetails?: string; // Added to check if profile exists before allowing click
  onBarClick: (department: { universityName: string, departmentName: string }) => void;
}

const chartConfig = {
  applicationWindow: {
    label: 'Application Window',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;


export function DeadlineChart({ selectedDepartments, cardClassName, userProfileDetails, onBarClick }: DeadlineChartProps) {
  const [chartData, setChartData] = React.useState<ChartDeadlineData[]>([]);
  const [dateDomain, setDateDomain] = React.useState<[number, number]>([0,0]);

  React.useEffect(() => {
    if (selectedDepartments.length > 0) {
      const deadlinesData = selectedDepartments.map(dept => {
        const mock = MOCK_DEADLINES.find(d => d.departmentName === dept.departmentName) || 
                     MOCK_DEADLINES.find(d => d.departmentName === PREDEFINED_DEPARTMENTS[0])!; 
        
        return {
          name: `${dept.universityName} - ${dept.departmentName}`,
          universityName: dept.universityName,
          departmentName: dept.departmentName,
          open: mock.applicationOpen.getTime(),
          deadline: mock.applicationDeadline.getTime(),
        };
      });

      const allDates = deadlinesData.flatMap(d => [d.open, d.deadline]);
      const minDate = Math.min(...allDates);
      const maxDate = Math.max(...allDates);
      
      setDateDomain([minDate, maxDate]);

      const transformedData: ChartDeadlineData[] = deadlinesData.map(d => ({
        name: d.name,
        universityName: d.universityName,
        departmentName: d.departmentName,
        applicationWindow: [d.open, d.deadline], 
        start: minDate, // Not directly used by Bar, but good for context if needed
        open: d.open,
        deadline: d.deadline,
      }));
      setChartData(transformedData);
    }
  }, [selectedDepartments]);

  if (selectedDepartments.length === 0) {
    return (
      <Card className={cn("w-full max-w-5xl", cardClassName)}>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Application Deadlines</CardTitle>
          <CardDescription>Select university departments to see their application deadline overview.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No university departments selected.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn("w-full max-w-5xl", cardClassName)}>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Application Deadline Overview</CardTitle>
        <CardDescription>
          This Gantt-style chart visualizes the application windows. Click on a bar to get AI-generated application tips.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
        <ChartContainer config={chartConfig} className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              layout="vertical" 
              data={chartData} 
              margin={{ left: 20, right: 30, top: 20, bottom: 20 }}
            >
              <CartesianGrid horizontal={true} vertical={false} strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="applicationWindow" 
                domain={dateDomain}
                tickFormatter={(unixTime) => format(new Date(unixTime), 'MMM yyyy')} 
                scale="time"
                tickCount={6}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={250} 
                tick={{ fontSize: 12 }} 
                axisLine={false}
                tickLine={false}
                interval={0} 
              />
              <Tooltip 
                cursor={{fill: 'hsl(var(--muted))', opacity: 0.3}}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ChartDeadlineData;
                    const [open, deadline] = data.applicationWindow as [number, number];
                    return (
                      <div className="rounded-lg border bg-card p-2.5 shadow-sm">
                        <div className="grid grid-cols-1 gap-1.5">
                           <p className="font-medium">{data.name}</p>
                           <p className="text-sm text-muted-foreground">
                             Open: {format(new Date(open), 'MMM d, yyyy')}
                           </p>
                           <p className="text-sm text-muted-foreground">
                             Deadline: {format(new Date(deadline), 'MMM d, yyyy')}
                           </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="applicationWindow" 
                fill="var(--color-applicationWindow)" 
                radius={4}
                barSize={20}
                onClick={(data, index) => {
                  // data here is the item from chartData for the clicked bar
                  if (data && onBarClick && userProfileDetails) {
                    onBarClick({ universityName: data.universityName, departmentName: data.departmentName });
                  }
                }}
                style={{ cursor: userProfileDetails ? 'pointer' : 'default' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        ) : (
          <p className="text-muted-foreground text-center py-8">Loading chart data or no data available.</p>
        )}
      </CardContent>
    </Card>
  );
}

