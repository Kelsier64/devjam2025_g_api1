
import type { MockDeadlineData } from '@/types';

export const PREDEFINED_DEPARTMENTS = [
  "Computer Science",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Business Administration",
  "Biology",
  "Chemistry",
  "Physics",
  "Mathematics",
  "Data Science",
  "Artificial Intelligence",
  "Economics",
  "Psychology",
  "Fine Arts",
  "Music",
  "History",
  "Literature",
];

export const MOCK_DEADLINES: MockDeadlineData[] = [
  // Fall/Winter Applications (earlier deadlines)
  { departmentName: "Computer Science", applicationOpen: new Date(2024, 7, 15), applicationDeadline: new Date(2024, 11, 1) },    // Aug 15 - Dec 1
  { departmentName: "Data Science", applicationOpen: new Date(2024, 8, 1), applicationDeadline: new Date(2024, 11, 15) },      // Sep 1 - Dec 15
  { departmentName: "Artificial Intelligence", applicationOpen: new Date(2024, 8, 1), applicationDeadline: new Date(2024, 11, 20) }, // Sep 1 - Dec 20
  { departmentName: "Business Administration", applicationOpen: new Date(2024, 8, 10), applicationDeadline: new Date(2024, 11, 31) }, // Sep 10 - Dec 31
  { departmentName: "Economics", applicationOpen: new Date(2024, 8, 20), applicationDeadline: new Date(2025, 0, 5) },        // Sep 20 - Jan 5
  
  // Winter/Spring Applications (standard deadlines)
  { departmentName: "Electrical Engineering", applicationOpen: new Date(2024, 9, 1), applicationDeadline: new Date(2025, 0, 15) },   // Oct 1 - Jan 15
  { departmentName: "Mathematics", applicationOpen: new Date(2024, 9, 10), applicationDeadline: new Date(2025, 0, 31) },    // Oct 10 - Jan 31
  { departmentName: "Physics", applicationOpen: new Date(2024, 9, 15), applicationDeadline: new Date(2025, 1, 10) },        // Oct 15 - Feb 10
  { departmentName: "Biology", applicationOpen: new Date(2024, 10, 1), applicationDeadline: new Date(2025, 1, 20) },       // Nov 1 - Feb 20
  { departmentName: "Chemistry", applicationOpen: new Date(2024, 10, 5), applicationDeadline: new Date(2025, 1, 28) },      // Nov 5 - Feb 28

  // Spring/Early Summer Applications (later deadlines)
  { departmentName: "Mechanical Engineering", applicationOpen: new Date(2024, 10, 15), applicationDeadline: new Date(2025, 2, 15) }, // Nov 15 - Mar 15
  { departmentName: "Psychology", applicationOpen: new Date(2024, 11, 1), applicationDeadline: new Date(2025, 2, 31) },     // Dec 1 - Mar 31
  { departmentName: "History", applicationOpen: new Date(2024, 11, 10), applicationDeadline: new Date(2025, 3, 10) },      // Dec 10 - Apr 10
  { departmentName: "Literature", applicationOpen: new Date(2025, 0, 5), applicationDeadline: new Date(2025, 3, 20) },       // Jan 5 - Apr 20
  { departmentName: "Fine Arts", applicationOpen: new Date(2025, 0, 15), applicationDeadline: new Date(2025, 4, 1) },        // Jan 15 - May 1
  { departmentName: "Music", applicationOpen: new Date(2025, 1, 1), applicationDeadline: new Date(2025, 4, 15) },          // Feb 1 - May 15
];

// Ensure all predefined departments have a mock deadline
PREDEFINED_DEPARTMENTS.forEach(deptName => {
  if (!MOCK_DEADLINES.find(d => d.departmentName === deptName)) {
    // Add a default mock deadline if missing, varied slightly
    const randomMonthOffsetOpen = Math.floor(Math.random() * 3); // 0, 1, or 2
    const randomDayOpen = Math.floor(Math.random() * 28) + 1; // 1-28
    const randomDurationMonths = Math.floor(Math.random() * 2) + 2; // 2 or 3 months

    const openDate = new Date(2024, 9 + randomMonthOffsetOpen, randomDayOpen);
    const deadlineDate = new Date(openDate.getFullYear(), openDate.getMonth() + randomDurationMonths, openDate.getDate());
    
    MOCK_DEADLINES.push({
      departmentName: deptName,
      applicationOpen: openDate,
      applicationDeadline: deadlineDate
    });
  }
});
