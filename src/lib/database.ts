import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
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

// Hour Types (Global)
export const createHourType = async (hourType: Omit<HourType, 'id' | 'createdAt' | 'updatedAt'>) => {
  checkDatabase();
  const docRef = await addDoc(collection(db, 'hourTypes'), {
    ...hourType,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  return docRef.id;
};

export const getHourTypes = async (): Promise<HourType[]> => {
  checkDatabase();
  const querySnapshot = await getDocs(
    query(collection(db, 'hourTypes'), orderBy('name'))
  );
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate()
  })) as HourType[];
};

export const updateHourType = async (id: string, updates: Partial<HourType>) => {
  checkDatabase();
  await updateDoc(doc(db, 'hourTypes', id), {
    ...updates,
    updatedAt: Timestamp.now()
  });
};

export const deleteHourType = async (id: string) => {
  checkDatabase();
  await deleteDoc(doc(db, 'hourTypes', id));
};

// Scenarios
export const createScenario = async (scenario: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>) => {
  checkDatabase();
  const docRef = await addDoc(collection(db, 'scenarios'), {
    ...scenario,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  return docRef.id;
};

export const getScenarios = async (): Promise<Scenario[]> => {
  checkDatabase();
  const querySnapshot = await getDocs(
    query(collection(db, 'scenarios'), orderBy('updatedAt', 'desc'))
  );
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate()
  })) as Scenario[];
};

export const getScenario = async (id: string): Promise<Scenario | null> => {
  const docSnap = await getDoc(doc(db, 'scenarios', id));
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt.toDate(),
      updatedAt: docSnap.data().updatedAt.toDate()
    } as Scenario;
  }
  return null;
};

export const updateScenario = async (id: string, updates: Partial<Scenario>) => {
  await updateDoc(doc(db, 'scenarios', id), {
    ...updates,
    updatedAt: Timestamp.now()
  });
};

export const deleteScenario = async (id: string) => {
  await deleteDoc(doc(db, 'scenarios', id));
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
  scenarioId: string, 
  hourTypeId: string, 
  hoursToAllocate: number
) => {
  const scenario = await getScenario(scenarioId);
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

  await updateScenario(scenarioId, { hourBanks: updatedHourBanks });
};

// Allocation management
export const createAllocation = async (
  scenarioId: string,
  allocation: Omit<Allocation, 'id' | 'createdAt'>
) => {
  // First, update the hour bank
  await updateHourBankAllocation(scenarioId, allocation.hourTypeId, allocation.hours);

  // Then create the allocation record
  const scenario = await getScenario(scenarioId);
  if (!scenario) throw new Error('Scenario not found');

  const newAllocation: Allocation = {
    ...allocation,
    id: Date.now().toString(), // Simple ID generation
    createdAt: new Date()
  };

  const updatedAllocations = [...scenario.allocations, newAllocation];
  await updateScenario(scenarioId, { allocations: updatedAllocations });

  return newAllocation.id;
};

export const removeAllocation = async (scenarioId: string, allocationId: string) => {
  const scenario = await getScenario(scenarioId);
  if (!scenario) throw new Error('Scenario not found');

  const allocation = scenario.allocations.find(a => a.id === allocationId);
  if (!allocation) throw new Error('Allocation not found');

  // Update hour bank (add back the hours)
  await updateHourBankAllocation(scenarioId, allocation.hourTypeId, -allocation.hours);

  // Remove allocation
  const updatedAllocations = scenario.allocations.filter(a => a.id !== allocationId);
  await updateScenario(scenarioId, { allocations: updatedAllocations });
};

// Export/Import functionality
export const exportScenario = async (scenarioId: string): Promise<ScenarioExport> => {
  const scenario = await getScenario(scenarioId);
  if (!scenario) throw new Error('Scenario not found');
  
  // Get hour types that have allocated hours (non-zero total hours)
  const allocatedHourBanks = scenario.hourBanks.filter(bank => bank.totalHours > 0);
  const hourTypeIds = allocatedHourBanks.map(bank => bank.hourTypeId);
  const allHourTypes = await getHourTypes();
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

export const validateScenarioImport = async (exportData: ScenarioExport): Promise<ImportValidationResult> => {
  try {
    const existingHourTypes = await getHourTypes();
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
  exportData: ScenarioExport, 
  createMissingHourTypes: boolean = false
): Promise<string> => {
  const validation = await validateScenarioImport(exportData);
  
  // Create missing hour types if requested
  if (createMissingHourTypes && validation.missingHourTypes.length > 0) {
    for (const hourType of validation.missingHourTypes) {
      await createHourType({
        name: hourType.name,
        description: hourType.description,
        color: hourType.color,
        isClassHour: hourType.isClassHour
      });
    }
  }
  
  // Get current hour types to map IDs
  const currentHourTypes = await getHourTypes();
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
  
  return await createScenario(newScenario);
};