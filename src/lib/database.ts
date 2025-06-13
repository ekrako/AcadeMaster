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
  HourBank 
} from '@/types';

// Database availability check
const checkDatabase = () => {
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
  return teacher.allocatedHours.reduce((total, allocation) => total + allocation.hours, 0);
};

export const calculateClassTotalHours = (classData: Class): number => {
  return classData.requiredHours.reduce((total, requirement) => total + requirement.hours, 0);
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