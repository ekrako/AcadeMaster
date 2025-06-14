import { Scenario, HourType, Teacher, Allocation, Class } from '@/types';

export interface ReportData {
  hourTypes: HourType[];
  teachers: Teacher[];
  matrix: number[][]; // [hourTypeIndex][teacherIndex] = hours
  hourTypeTotals: number[];
  teacherTotals: number[];
  grandTotal: number;
}

export interface ClassAllocationDetail {
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  hours: number;
}

export interface HourTypeClassBreakdown {
  hourType: HourType;
  classAllocations: ClassAllocationDetail[];
  totalHours: number;
  teacherTotals: { [teacherId: string]: number };
}

export interface DetailedReportData {
  hourTypeBreakdowns: HourTypeClassBreakdown[];
  teachers: Teacher[];
  classes: Class[];
  grandTotal: number;
  teacherGrandTotals: { [teacherId: string]: number };
}

export interface TeacherHourBreakdown {
  teacherId: string;
  teacherName: string;
  hourBreakdown: {
    hourTypeId: string;
    hourTypeName: string;
    hours: number;
  }[];
  totalHours: number;
}

/**
 * Generate report data matrix from scenario data
 * Matrix format: rows = hour types, columns = teachers
 */
export function generateReportData(
  scenario: Scenario,
  hourTypes: HourType[]
): ReportData {
  const { teachers, allocations } = scenario;
  
  // Filter hour types to only include those that have allocations
  const relevantHourTypeIds = new Set(allocations.map(a => a.hourTypeId));
  const relevantHourTypes = hourTypes.filter(ht => relevantHourTypeIds.has(ht.id));
  
  // Initialize matrix with zeros
  const matrix: number[][] = Array(relevantHourTypes.length)
    .fill(null)
    .map(() => Array(teachers.length).fill(0));
  
  // Populate matrix with allocation data
  allocations.forEach(allocation => {
    const hourTypeIndex = relevantHourTypes.findIndex(ht => ht.id === allocation.hourTypeId);
    const teacherIndex = teachers.findIndex(t => t.id === allocation.teacherId);
    
    if (hourTypeIndex >= 0 && teacherIndex >= 0) {
      matrix[hourTypeIndex][teacherIndex] += allocation.hours;
    }
  });
  
  // Calculate totals
  const hourTypeTotals = matrix.map(row => 
    row.reduce((sum, hours) => sum + hours, 0)
  );
  
  const teacherTotals = teachers.map((_, teacherIndex) => 
    matrix.reduce((sum, row) => sum + row[teacherIndex], 0)
  );
  
  const grandTotal = hourTypeTotals.reduce((sum, total) => sum + total, 0);
  
  return {
    hourTypes: relevantHourTypes,
    teachers,
    matrix,
    hourTypeTotals,
    teacherTotals,
    grandTotal
  };
}

/**
 * Get detailed breakdown of hours for each teacher
 */
export function getTeacherHourBreakdowns(
  scenario: Scenario,
  hourTypes: HourType[]
): TeacherHourBreakdown[] {
  const { teachers, allocations } = scenario;
  
  return teachers.map(teacher => {
    const teacherAllocations = allocations.filter(a => a.teacherId === teacher.id);
    
    // Group by hour type
    const hourTypeMap = new Map<string, number>();
    teacherAllocations.forEach(allocation => {
      const current = hourTypeMap.get(allocation.hourTypeId) || 0;
      hourTypeMap.set(allocation.hourTypeId, current + allocation.hours);
    });
    
    // Create breakdown array
    const hourBreakdown = Array.from(hourTypeMap.entries()).map(([hourTypeId, hours]) => {
      const hourType = hourTypes.find(ht => ht.id === hourTypeId);
      return {
        hourTypeId,
        hourTypeName: hourType?.name || 'לא זוהה',
        hours
      };
    });
    
    const totalHours = hourBreakdown.reduce((sum, item) => sum + item.hours, 0);
    
    return {
      teacherId: teacher.id,
      teacherName: teacher.name,
      hourBreakdown,
      totalHours
    };
  });
}

/**
 * Calculate utilization percentage for teachers
 */
export function calculateTeacherUtilization(
  teachers: Teacher[],
  teacherTotals: number[]
): number[] {
  return teachers.map((teacher, index) => {
    if (teacher.maxHours <= 0) return 0;
    return Math.round((teacherTotals[index] / teacher.maxHours) * 100);
  });
}

/**
 * Get summary statistics for the scenario
 */
export function getScenarioSummary(reportData: ReportData) {
  const { teachers, teacherTotals, grandTotal } = reportData;
  const utilization = calculateTeacherUtilization(teachers, teacherTotals);
  
  const totalMaxHours = teachers.reduce((sum, teacher) => sum + teacher.maxHours, 0);
  const averageUtilization = totalMaxHours > 0 ? Math.round((grandTotal / totalMaxHours) * 100) : 0;
  
  return {
    totalTeachers: teachers.length,
    totalAllocatedHours: grandTotal,
    totalMaxHours,
    averageUtilization,
    teachersOverAllocated: utilization.filter(u => u > 100).length,
    teachersUnderUtilized: utilization.filter(u => u < 80).length
  };
}

/**
 * Generate detailed report data with class-level breakdowns
 * Shows class allocations grouped by hour types with summarization rows
 */
export function generateDetailedReportData(
  scenario: Scenario,
  hourTypes: HourType[]
): DetailedReportData {
  const { teachers, classes, allocations } = scenario;
  
  // Filter hour types to only include those that have allocations
  const relevantHourTypeIds = new Set(allocations.map(a => a.hourTypeId));
  const relevantHourTypes = hourTypes.filter(ht => relevantHourTypeIds.has(ht.id));
  
  // Generate breakdowns for each hour type
  const hourTypeBreakdowns: HourTypeClassBreakdown[] = relevantHourTypes.map(hourType => {
    // Get all allocations for this hour type
    const hourTypeAllocations = allocations.filter(a => a.hourTypeId === hourType.id);
    
    // Create class allocation details
    const classAllocations: ClassAllocationDetail[] = [];
    
    hourTypeAllocations.forEach(allocation => {
      const teacher = teachers.find(t => t.id === allocation.teacherId);
      
      // Handle both single classId and multiple classIds
      const classIds = allocation.classIds && allocation.classIds.length > 0 
        ? allocation.classIds 
        : allocation.classId ? [allocation.classId] : [];
      
      if (classIds.length === 0) {
        // General allocation without specific class
        classAllocations.push({
          classId: 'general',
          className: 'הקצאה כללית',
          teacherId: allocation.teacherId,
          teacherName: teacher?.name || 'לא זוהה',
          hours: allocation.hours
        });
      } else {
        // Specific class allocations
        classIds.forEach(classId => {
          const classData = classes.find(c => c.id === classId);
          classAllocations.push({
            classId,
            className: classData?.name || `כיתה ${classId}`,
            teacherId: allocation.teacherId,
            teacherName: teacher?.name || 'לא זוהה',
            hours: allocation.hours
          });
        });
      }
    });
    
    // Calculate totals for this hour type
    const totalHours = classAllocations.reduce((sum, ca) => sum + ca.hours, 0);
    
    // Calculate teacher totals for this hour type
    const teacherTotals: { [teacherId: string]: number } = {};
    classAllocations.forEach(ca => {
      teacherTotals[ca.teacherId] = (teacherTotals[ca.teacherId] || 0) + ca.hours;
    });
    
    return {
      hourType,
      classAllocations,
      totalHours,
      teacherTotals
    };
  });
  
  // Calculate grand totals
  const grandTotal = hourTypeBreakdowns.reduce((sum, htb) => sum + htb.totalHours, 0);
  
  // Calculate teacher grand totals across all hour types
  const teacherGrandTotals: { [teacherId: string]: number } = {};
  hourTypeBreakdowns.forEach(htb => {
    Object.entries(htb.teacherTotals).forEach(([teacherId, hours]) => {
      teacherGrandTotals[teacherId] = (teacherGrandTotals[teacherId] || 0) + hours;
    });
  });
  
  return {
    hourTypeBreakdowns,
    teachers,
    classes,
    grandTotal,
    teacherGrandTotals
  };
}