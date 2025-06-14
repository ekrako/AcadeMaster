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
    await set(ref(db, `users/${userId}`), sanitizedData);
  }, 'createUserDocument');
};

export const getUserDocument = async (userId: string) => {
  return withErrorHandling(async () => {
    checkDatabase();
    const snapshot = await get(ref(db, `users/${userId}`));
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
    await update(ref(db, `users/${userId}`), sanitizedUpdates);
  }, 'updateUserLastLogin');
};

// Hour Types (User-scoped)
export const createHourType = async (userId: string, hourType: Omit<HourType, 'id' | 'createdAt' | 'updatedAt'>) => {
  return withErrorHandling(async () => {
    checkDatabase();
    const hourTypesRef = ref(db, `users/${userId}/hourTypes`);
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
    const snapshot = await get(ref(db, `users/${userId}/hourTypes`));
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
    await update(ref(db, `users/${userId}/hourTypes/${id}`), sanitizedUpdates);
  }, 'updateHourType');
};

export const deleteHourType = async (userId: string, id: string) => {
  return withErrorHandling(async () => {
    checkDatabase();
    await remove(ref(db, `users/${userId}/hourTypes/${id}`));
  }, 'deleteHourType');
};

// Scenarios (User-scoped)
export const createScenario = async (userId: string, scenario: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>) => {
  return withErrorHandling(async () => {
    checkDatabase();
    const scenariosRef = ref(db, `users/${userId}/scenarios`);
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
    const snapshot = await get(ref(db, `users/${userId}/scenarios`));
    if (snapshot.exists()) {
      const data = snapshot.val();
      const scenarios = Object.entries(data).map(([id, scenario]: [string, any]) => ({
        id,
        ...scenario,
        createdAt: convertTimestamp(scenario.createdAt),
        updatedAt: convertTimestamp(scenario.updatedAt)
      })) as Scenario[];
      // Sort by updatedAt desc (most recent first) on client side
      return scenarios.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }
    return [];
  }, 'getScenarios');
};

export const getScenario = async (userId: string, id: string): Promise<Scenario | null> => {
  return withErrorHandling(async () => {
    checkDatabase();
    const snapshot = await get(ref(db, `users/${userId}/scenarios/${id}`));
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
    const sanitizedUpdates = sanitizeData({
      ...updates,
      updatedAt: serverTimestamp()
    });
    await update(ref(db, `users/${userId}/scenarios/${id}`), sanitizedUpdates);
  }, 'updateScenario');
};

export const deleteScenario = async (userId: string, id: string) => {
  return withErrorHandling(async () => {
    checkDatabase();
    await remove(ref(db, `users/${userId}/scenarios/${id}`));
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
  const scenario = await getScenario(userId, scenarioId);
  if (!scenario) throw new Error('Scenario not found');
  
  // Get hour types that have allocated hours (non-zero total hours)
  const allocatedHourBanks = scenario.hourBanks.filter(bank => bank.totalHours > 0);
  const hourTypeIds = allocatedHourBanks.map(bank => bank.hourTypeId);
  const allHourTypes = await getHourTypes(userId);
  const scenarioHourTypes = allHourTypes.filter(ht => hourTypeIds.includes(ht.id));
  
  return {
    scenario: {
      ...scenario,
      hourBanks: allocatedHourBanks
    },
    hourTypes: scenarioHourTypes,
    exportedAt: new Date(),
    version: '1.0'
  };
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
  
  // Create the scenario with updated hour type IDs
  const newScenario: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'> = {
    ...exportData.scenario,
    name: `${exportData.scenario.name} (מיובא)`,
    isActive: false,
    hourBanks: exportData.scenario.hourBanks.map(bank => ({
      ...bank,
      id: `${Date.now()}-${bank.hourTypeId}`,
      hourTypeId: hourTypeIdMap.get(bank.hourTypeId) || bank.hourTypeId
    })),
    allocations: exportData.scenario.allocations.map(allocation => ({
      ...allocation,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      hourTypeId: hourTypeIdMap.get(allocation.hourTypeId) || allocation.hourTypeId,
      createdAt: new Date()
    }))
  };
  
  return await createScenario(userId, newScenario);
};