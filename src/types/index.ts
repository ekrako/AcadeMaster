// Global Hour Types (reusable across scenarios)
export interface HourType {
  id: string;
  name: string;
  description?: string;
  color: string; // Hex color for UI
  isClassHour?: boolean; // Whether this hour type requires class assignment
  createdAt: Date;
  updatedAt: Date;
}

// Scenario-specific data models
export interface Scenario {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  hourBanks: HourBank[];
  teachers: Teacher[];
  classes: Class[];
  allocations: Allocation[];
}

// Hour bank - scenario-specific quantities for each hour type
export interface HourBank {
  id: string;
  hourTypeId: string; // Reference to global HourType
  totalHours: number;
  allocatedHours: number;
  remainingHours: number; // calculated field
}

// Teacher within a scenario
export interface Teacher {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  idNumber: string; // ID number (was employeeId)
  subject?: string;
  maxHours: number;
  allocatedHours: number;
}

// Teacher's allocated hours by type
export interface TeacherAllocation {
  hourTypeId: string;
  hours: number;
}

// Class within a scenario
export interface Class {
  id: string;
  name: string;
  grade: string; // e.g., "א", "ב", "ג"
  studentCount: number;
  homeroomTeacherId?: string;
  isSpecialEducation?: boolean;
}

// Class requirements by hour type
export interface ClassRequirement {
  hourTypeId: string;
  hours: number;
}

// Allocation - connects teacher to class(es) using specific hour type
export interface Allocation {
  id: string;
  teacherId: string;
  classId: string; // Can be empty for general allocation (deprecated, use classIds)
  classIds?: string[]; // Multiple classes for this allocation
  hourTypeId: string;
  hours: number;
  createdAt: Date;
  notes?: string;
}

// Report types
export interface TeacherWorkloadReport {
  teacherId: string;
  teacherName: string;
  hourBreakdown: {
    hourTypeId: string;
    hourTypeName: string;
    hours: number;
  }[];
  totalHours: number;
  utilizationPercentage: number;
}

export interface HourBankReport {
  hourTypeId: string;
  hourTypeName: string;
  totalHours: number;
  allocatedHours: number;
  remainingHours: number;
  utilizationPercentage: number;
}

export interface ScenarioComparisonReport {
  scenarios: {
    id: string;
    name: string;
    totalTeachers: number;
    totalClasses: number;
    totalHourBankUtilization: number;
    efficiency: number;
  }[];
}

// UI State types
export interface AppState {
  currentScenario: Scenario | null;
  scenarios: Scenario[];
  globalHourTypes: HourType[];
  loading: boolean;
  error: string | null;
}

// Form types for creating/editing
export interface CreateScenarioForm {
  name: string;
  description?: string;
  copyFromScenarioId?: string;
}

export interface CreateHourTypeForm {
  name: string;
  description?: string;
  color: string;
  isClassHour?: boolean;
}

export interface CreateTeacherForm {
  name: string;
  email?: string;
  qualifications: string[];
  specializations: string[];
  maxWeeklyHours: number;
}

export interface CreateClassForm {
  grade: string;
  section?: string;
  subject: string;
  requiredHours: {
    hourTypeId: string;
    hours: number;
  }[];
}

// Export/Import types
export interface ScenarioExport {
  scenario: Scenario;
  hourTypes: HourType[];
  exportedAt: Date;
  version: string;
}

export interface ImportValidationResult {
  isValid: boolean;
  missingHourTypes: HourType[];
  existingHourTypes: HourType[];
  warnings: string[];
}