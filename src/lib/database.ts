import { 
  ref, 
  push, 
  set, 
  get, 
  update, 
  remove, 
  query, 
  orderByChild, 
  orderByKey,
  equalTo,
  serverTimestamp 
} from 'firebase/database';
import { db } from './firebase';
import { 
  HourType, 
  Scenario, 
  Teacher, 
  Class, 
  Allocation, 
  HourBank,
  ScenarioExport,
  ImportValidationResult
} from '@/types';

// Test database connection
export const testDatabaseConnection = async () => {
  try {
    checkDatabase();
    const testRef = ref(db!, '.info/connected');
    const snapshot = await get(testRef);
    console.log('Database connection test:', snapshot.val());
    return snapshot.val() === true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

// Database availability check
const checkDatabase = () => {
  if (typeof window === 'undefined') {
    throw new Error('Database operations can only be performed on the client side.');
  }
  if (!db) {
    throw new Error('Firebase not initialized. Please configure Firebase to use database features.');
  }
};

// Data sanitization function to remove undefined values
const sanitizeData = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeData).filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeData(value);
      }
    }
    return sanitized;
  }
  
  return obj;
};

// Enhanced error handling wrapper
const withErrorHandling = async <T>(operation: () => Promise<T>, operationName: string): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    console.error(`Database operation '${operationName}' failed:`, error);
    
    // Handle specific Firebase Realtime Database errors
    if (error.code) {
      switch (error.code) {
        case 'PERMISSION_DENIED':
          throw new Error('אין הרשאה לגישה לנתונים. אנא התחבר מחדש.');
        case 'NETWORK_ERROR':
          throw new Error('שגיאת רשת. אנא בדוק את החיבור לאינטרנט.');
        case 'UNAVAILABLE':
          throw new Error('השירות אינו זמין כרגע. אנא נסה שוב מאוחר יותר.');
        default:
          throw new Error(`שגיאה במסד הנתונים: ${error.message}`);
      }
    }
    
    throw new Error(`שגיאה במסד הנתונים: ${error.message || 'שגיאה לא ידועה'}`);
  }
};


// Helper function to convert timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp && typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  if (timestamp && timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date();
};

// User management
export const createUserDocument = async (userId: string, userData: {
  email: string;
  displayName: string;
  photoURL?: string;
}) => {
  return withErrorHandling(async () => {
    checkDatabase();
    const sanitizedData = sanitizeData({
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });
    await set(ref(db!, `users/${userId}`), sanitizedData);
  }, 'createUserDocument');
};

export const getUserDocument = async (userId: string) => {
  return withErrorHandling(async () => {
    checkDatabase();
    const snapshot = await get(ref(db!, `users/${userId}`));
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        id: userId,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        lastLoginAt: convertTimestamp(data.lastLoginAt)
      };
    }
    return null;
  }, 'getUserDocument');
};

export const updateUserLastLogin = async (userId: string) => {
  return withErrorHandling(async () => {
    checkDatabase();
    const sanitizedUpdates = sanitizeData({
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    await update(ref(db!, `users/${userId}`), sanitizedUpdates);
  }, 'updateUserLastLogin');
};

// Hour Types (User-scoped)
export const createHourType = async (userId: string, hourType: Omit<HourType, 'id' | 'createdAt' | 'updatedAt'>) => {
  return withErrorHandling(async () => {
    checkDatabase();
    const hourTypesRef = ref(db!, `users/${userId}/hourTypes`);
    const newHourTypeRef = push(hourTypesRef);
    
    // Ensure required fields have default values
    const sanitizedHourType = sanitizeData({
      name: hourType.name || '',
      description: hourType.description || '',
      color: hourType.color || '#3B82F6',
      isClassHour: hourType.isClassHour !== undefined ? hourType.isClassHour : false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    await set(newHourTypeRef, sanitizedHourType);
    return newHourTypeRef.key!;
  }, 'createHourType');
};

export const getHourTypes = async (userId: string): Promise<HourType[]> => {
  return withErrorHandling(async () => {
    checkDatabase();
    const hourTypesRef = ref(db!, `users/${userId}/hourTypes`);
    const snapshot = await get(hourTypesRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const hourTypes = Object.entries(data).map(([id, hourType]: [string, any]) => ({
        id,
        ...hourType,
        createdAt: convertTimestamp(hourType.createdAt),
        updatedAt: convertTimestamp(hourType.updatedAt)
      })) as HourType[];
      
      // Sort by name on client side instead of using database ordering
      return hourTypes.sort((a, b) => a.name.localeCompare(b.name, 'he'));
    }
    return [];
  }, 'getHourTypes');
};

export const updateHourType = async (userId: string, id: string, updates: Partial<HourType>) => {
  return withErrorHandling(async () => {
    checkDatabase();
    const sanitizedUpdates = sanitizeData({
      ...updates,
      updatedAt: serverTimestamp()
    });
    await update(ref(db!, `users/${userId}/hourTypes/${id}`), sanitizedUpdates);
  }, 'updateHourType');
};

export const deleteHourType = async (userId: string, id: string) => {
  return withErrorHandling(async () => {
    checkDatabase();
    await remove(ref(db!, `users/${userId}/hourTypes/${id}`));
  }, 'deleteHourType');
};

// Scenarios (User-scoped)
export const createScenario = async (userId: string, scenario: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>) => {
  return withErrorHandling(async () => {
    checkDatabase();
    const scenariosRef = ref(db!, `users/${userId}/scenarios`);
    const newScenarioRef = push(scenariosRef);
    
    const sanitizedScenario = sanitizeData({
      ...scenario,
      teachers: scenario.teachers || [],
      classes: scenario.classes || [],
      allocations: scenario.allocations || [],
      hourBanks: scenario.hourBanks || [],
      isActive: scenario.isActive !== undefined ? scenario.isActive : false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    await set(newScenarioRef, sanitizedScenario);
    return newScenarioRef.key!;
  }, 'createScenario');
};

export const getScenarios = async (userId: string): Promise<Scenario[]> => {
  return withErrorHandling(async () => {
    checkDatabase();
    const snapshot = await get(ref(db!, `users/${userId}/scenarios`));
    if (snapshot.exists()) {
      const data = snapshot.val();
      const scenarios = Object.entries(data).map(([id, scenario]: [string, any]) => {
        // Ensure we have valid data structure
        const scenarioData = {
          id,
          ...scenario,
          createdAt: convertTimestamp(scenario.createdAt),
          updatedAt: convertTimestamp(scenario.updatedAt),
          // Ensure arrays exist
          hourBanks: Array.isArray(scenario.hourBanks) ? scenario.hourBanks : [],
          teachers: Array.isArray(scenario.teachers) ? scenario.teachers : [],
          classes: Array.isArray(scenario.classes) ? scenario.classes : [],
          allocations: Array.isArray(scenario.allocations) ? scenario.allocations : []
        };
        
        return scenarioData;
      }) as Scenario[];
      
      // Sort by updatedAt desc (most recent first) on client side
      return scenarios.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }
    return [];
  }, 'getScenarios');
};

export const getScenario = async (userId: string, id: string): Promise<Scenario | null> => {
  return withErrorHandling(async () => {
    checkDatabase();
    const snapshot = await get(ref(db!, `users/${userId}/scenarios/${id}`));
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt)
      } as Scenario;
    }
    return null;
  }, 'getScenario');
};

export const updateScenario = async (userId: string, id: string, updates: Partial<Scenario>) => {
  return withErrorHandling(async () => {
    checkDatabase();
    
    // Fetch the latest scenario data first
    const scenarioRef = ref(db!, `users/${userId}/scenarios/${id}`);
    const snapshot = await get(scenarioRef);
    
    if (!snapshot.exists()) {
      throw new Error('Scenario not found');
    }
    
    const existingScenario = snapshot.val();
    
    // Merge existing data with updates
    const mergedUpdates = {
      ...existingScenario,
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    const sanitizedUpdates = sanitizeData(mergedUpdates);
    
    await set(scenarioRef, sanitizedUpdates);
  }, 'updateScenario');
};

export const updateScenarioPartial = async (userId: string, id: string, updates: Partial<Scenario>) => {
  return withErrorHandling(async () => {
    checkDatabase();
    
    const scenarioRef = ref(db!, `users/${userId}/scenarios/${id}`);
    
    // Create a new object for updates to ensure `updatedAt` is always included
    const updatesToApply = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    const sanitizedUpdates = sanitizeData(updatesToApply);
    
    await update(scenarioRef, sanitizedUpdates);
  }, 'updateScenarioPartial');
};

export const deleteScenario = async (userId: string, id: string) => {
  return withErrorHandling(async () => {
    checkDatabase();
    
    // First check if the scenario exists
    const scenarioRef = ref(db!, `users/${userId}/scenarios/${id}`);
    const snapshot = await get(scenarioRef);
    
    if (!snapshot.exists()) {
      throw new Error('התרחיש לא נמצא');
    }
    
    await remove(scenarioRef);
  }, 'deleteScenario');
};

// Utility functions for hour bank calculations
export const calculateRemainingHours = (hourBank: HourBank): number => {
  return hourBank.totalHours - hourBank.allocatedHours;
};

export const calculateTeacherTotalHours = (teacher: Teacher): number => {
  return teacher.allocatedHours;
};

export const calculateClassTotalHours = (classData: Class, allocations: Allocation[]): number => {
  return allocations
    .filter(allocation => allocation.classId === classData.id)
    .reduce((total, allocation) => total + allocation.hours, 0);
};

// Hour bank management
export const updateHourBankAllocation = async (
  userId: string,
  scenarioId: string, 
  hourTypeId: string, 
  hoursToAllocate: number
) => {
  const scenario = await getScenario(userId, scenarioId);
  if (!scenario) throw new Error('Scenario not found');

  const updatedHourBanks = scenario.hourBanks.map(bank => {
    if (bank.hourTypeId === hourTypeId) {
      return {
        ...bank,
        allocatedHours: bank.allocatedHours + hoursToAllocate,
        remainingHours: bank.totalHours - (bank.allocatedHours + hoursToAllocate)
      };
    }
    return bank;
  });

  await updateScenario(userId, scenarioId, { hourBanks: updatedHourBanks });
};

// Allocation management
export const createAllocation = async (
  userId: string,
  scenarioId: string,
  allocation: Omit<Allocation, 'id' | 'createdAt'>
) => {
  // First, update the hour bank
  await updateHourBankAllocation(userId, scenarioId, allocation.hourTypeId, allocation.hours);

  // Then create the allocation record
  const scenario = await getScenario(userId, scenarioId);
  if (!scenario) throw new Error('Scenario not found');

  const newAllocation: Allocation = {
    ...allocation,
    id: Date.now().toString(), // Simple ID generation
    createdAt: new Date()
  };

  const updatedAllocations = [...scenario.allocations, newAllocation];
  await updateScenario(userId, scenarioId, { allocations: updatedAllocations });

  return newAllocation.id;
};

export const removeAllocation = async (userId: string, scenarioId: string, allocationId: string) => {
  const scenario = await getScenario(userId, scenarioId);
  if (!scenario) throw new Error('Scenario not found');

  const allocation = scenario.allocations.find(a => a.id === allocationId);
  if (!allocation) throw new Error('Allocation not found');

  // Update hour bank (add back the hours)
  await updateHourBankAllocation(userId, scenarioId, allocation.hourTypeId, -allocation.hours);

  // Remove allocation
  const updatedAllocations = scenario.allocations.filter(a => a.id !== allocationId);
  await updateScenario(userId, scenarioId, { allocations: updatedAllocations });
};

// Export/Import functionality
export const exportScenario = async (userId: string, scenarioId: string): Promise<ScenarioExport> => {
  return withErrorHandling(async () => {
    const scenario = await getScenario(userId, scenarioId);
    if (!scenario) throw new Error('Scenario not found');
    
    // Ensure we have valid hourBanks array
    const hourBanks = Array.isArray(scenario.hourBanks) ? scenario.hourBanks : [];
    
    // Get hour types that have allocated hours (non-zero total hours)
    const allocatedHourBanks = hourBanks.filter(bank => 
      bank && typeof bank.totalHours === 'number' && bank.totalHours > 0
    );
    
    const hourTypeIds = allocatedHourBanks
      .map(bank => bank.hourTypeId)
      .filter(id => id && typeof id === 'string');
    
    const allHourTypes = await getHourTypes(userId);
    const scenarioHourTypes = allHourTypes.filter(ht => 
      ht && ht.id && hourTypeIds.includes(ht.id)
    );
    
    return {
      scenario: {
        ...scenario,
        hourBanks: allocatedHourBanks,
        teachers: Array.isArray(scenario.teachers) ? scenario.teachers : [],
        classes: Array.isArray(scenario.classes) ? scenario.classes : [],
        allocations: Array.isArray(scenario.allocations) ? scenario.allocations : []
      },
      hourTypes: scenarioHourTypes,
      exportedAt: new Date(),
      version: '1.0'
    };
  }, 'exportScenario');
};

export const validateScenarioImport = async (userId: string, exportData: ScenarioExport): Promise<ImportValidationResult> => {
  try {
    const existingHourTypes = await getHourTypes(userId);
    const missingHourTypes: HourType[] = [];
    const existingHourTypesInImport: HourType[] = [];
    const warnings: string[] = [];
    
    // Check which hour types are missing
    for (const hourType of exportData.hourTypes) {
      const exists = existingHourTypes.find(ht => 
        ht.name === hourType.name || ht.id === hourType.id
      );
      
      if (exists) {
        existingHourTypesInImport.push(exists);
        // Check if properties match
        if (exists.color !== hourType.color || exists.isClassHour !== hourType.isClassHour) {
          warnings.push(`סוג השעה "${hourType.name}" קיים אך עם הגדרות שונות`);
        }
      } else {
        missingHourTypes.push(hourType);
      }
    }
    
    // Additional validations
    if (!exportData.scenario.name) {
      warnings.push('התרחיש לא כולל שם');
    }
    
    if (exportData.scenario.hourBanks.length === 0) {
      warnings.push('התרחיש לא כולל בנק שעות');
    }
    
    return {
      isValid: true, // We'll allow import even with missing hour types
      missingHourTypes,
      existingHourTypes: existingHourTypesInImport,
      warnings
    };
  } catch (error) {
    return {
      isValid: false,
      missingHourTypes: [],
      existingHourTypes: [],
      warnings: [`שגיאה בבדיקת הקובץ: ${error}`]
    };
  }
};

export const importScenario = async (
  userId: string,
  exportData: ScenarioExport, 
  createMissingHourTypes: boolean = false
): Promise<string> => {
  return withErrorHandling(async () => {
    const validation = await validateScenarioImport(userId, exportData);
    
    // Create missing hour types if requested
    if (createMissingHourTypes && validation.missingHourTypes.length > 0) {
      for (const hourType of validation.missingHourTypes) {
        await createHourType(userId, {
          name: hourType.name,
          description: hourType.description,
          color: hourType.color,
          isClassHour: hourType.isClassHour
        });
      }
    }
    
    // Get current hour types to map IDs
    const currentHourTypes = await getHourTypes(userId);
    const hourTypeIdMap = new Map<string, string>();
    
    // Map old IDs to new IDs
    for (const hourType of exportData.hourTypes) {
      const current = currentHourTypes.find(ht => ht.name === hourType.name);
      if (current) {
        hourTypeIdMap.set(hourType.id, current.id);
      }
    }
    
    // Ensure we have valid arrays and proper structure
    const hourBanks = Array.isArray(exportData.scenario.hourBanks) ? exportData.scenario.hourBanks : [];
    const teachers = Array.isArray(exportData.scenario.teachers) ? exportData.scenario.teachers : [];
    const classes = Array.isArray(exportData.scenario.classes) ? exportData.scenario.classes : [];
    const allocations = Array.isArray(exportData.scenario.allocations) ? exportData.scenario.allocations : [];
    
    // Create mapping for old teacher IDs to new teacher IDs
    const teacherIdMap = new Map<string, string>();
    const newTeachers = teachers.map((teacher, index) => {
      const newTeacherId = `imported-teacher-${Date.now()}-${index}`;
      teacherIdMap.set(teacher.id, newTeacherId);
      return {
        ...teacher,
        id: newTeacherId,
        // Ensure numeric values
        maxHours: Number(teacher.maxHours) || 0,
        allocatedHours: 0 // Will be calculated below
      };
    });
    
    // Create mapping for old class IDs to new class IDs
    const classIdMap = new Map<string, string>();
    const newClasses = classes.map((cls, index) => {
      const newClassId = `imported-class-${Date.now()}-${index}`;
      classIdMap.set(cls.id, newClassId);
      return {
        ...cls,
        id: newClassId
      };
    });
    
    // Update allocations with new IDs
    const newAllocations = allocations.map((allocation, index) => ({
      ...allocation,
      id: `imported-allocation-${Date.now()}-${index}`,
      teacherId: teacherIdMap.get(allocation.teacherId) || allocation.teacherId,
      classId: allocation.classId ? (classIdMap.get(allocation.classId) || allocation.classId) : '',
      classIds: Array.isArray(allocation.classIds) ? 
        allocation.classIds.map(classId => classIdMap.get(classId) || classId) : 
        [],
      hourTypeId: hourTypeIdMap.get(allocation.hourTypeId) || allocation.hourTypeId,
      createdAt: new Date(),
      // Ensure numeric values
      hours: Number(allocation.hours) || 0
    }));
    
    // Calculate allocated hours for each teacher based on their allocations
    const teacherAllocatedHours = new Map<string, number>();
    newAllocations.forEach(allocation => {
      const currentHours = teacherAllocatedHours.get(allocation.teacherId) || 0;
      teacherAllocatedHours.set(allocation.teacherId, currentHours + allocation.hours);
    });
    
    // Update teachers with calculated allocated hours
    newTeachers.forEach(teacher => {
      teacher.allocatedHours = teacherAllocatedHours.get(teacher.id) || 0;
    });
    
    // Create the scenario with updated hour type IDs and proper structure
    const newScenario: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'> = {
      name: `${exportData.scenario.name} (מיובא)`,
      description: exportData.scenario.description || '',
      isActive: false,
      hourBanks: hourBanks.map((bank, index) => ({
        ...bank,
        id: `imported-${Date.now()}-${index}`,
        hourTypeId: hourTypeIdMap.get(bank.hourTypeId) || bank.hourTypeId,
        // Ensure numeric values
        totalHours: Number(bank.totalHours) || 0,
        allocatedHours: Number(bank.allocatedHours) || 0,
        remainingHours: Number(bank.remainingHours) || Number(bank.totalHours) || 0
      })),
      teachers: newTeachers,
      classes: newClasses,
      allocations: newAllocations
    };
    
    return await createScenario(userId, newScenario);
  }, 'importScenario');
};

export const duplicateScenario = async (userId: string, scenarioId: string): Promise<string> => {
  return withErrorHandling(async () => {
    checkDatabase();
    
    // Get the original scenario
    const originalScenario = await getScenario(userId, scenarioId);
    if (!originalScenario) {
      throw new Error('Scenario not found');
    }
    
    const timestamp = Date.now();
    
    // Create mapping for old teacher IDs to new teacher IDs
    const teacherIdMap = new Map<string, string>();
    const newTeachers = originalScenario.teachers.map((teacher, index) => {
      const newTeacherId = `dup-teacher-${timestamp}-${index}`;
      teacherIdMap.set(teacher.id, newTeacherId);
      return {
        ...teacher,
        id: newTeacherId
      };
    });
    
    // Create mapping for old class IDs to new class IDs
    const classIdMap = new Map<string, string>();
    const newClasses = originalScenario.classes.map((cls, index) => {
      const newClassId = `dup-class-${timestamp}-${index}`;
      classIdMap.set(cls.id, newClassId);
      return {
        ...cls,
        id: newClassId
      };
    });
    
    // Update allocations with new IDs
    const newAllocations = originalScenario.allocations.map((allocation, index) => ({
      ...allocation,
      id: `dup-allocation-${timestamp}-${index}`,
      teacherId: teacherIdMap.get(allocation.teacherId) || allocation.teacherId,
      classId: allocation.classId ? (classIdMap.get(allocation.classId) || allocation.classId) : ''
    }));
    
    // Update hour banks with new IDs
    const newHourBanks = originalScenario.hourBanks.map((bank, index) => ({
      ...bank,
      id: `dup-bank-${timestamp}-${index}`
    }));
    
    // Create the new scenario
    const duplicatedScenario = {
      name: `${originalScenario.name} - העתק`,
      description: originalScenario.description ? `${originalScenario.description} (העתק)` : 'העתק של התרחיש המקורי',
      isActive: false, // Duplicated scenarios start as inactive
      hourBanks: newHourBanks,
      teachers: newTeachers,
      classes: newClasses,
      allocations: newAllocations
    };
    
    return await createScenario(userId, duplicatedScenario);
  }, 'duplicateScenario');
};