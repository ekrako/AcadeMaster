'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { HourType, CreateHourTypeForm } from '@/types';
import { defaultHourTypes } from '@/lib/defaultData';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getHourTypes, 
  createHourType as createHourTypeDB, 
  updateHourType as updateHourTypeDB, 
  deleteHourType as deleteHourTypeDB 
} from '@/lib/database';

interface HourTypesContextType {
  hourTypes: HourType[];
  loading: boolean;
  error: string | null;
  createHourType: (hourType: CreateHourTypeForm) => Promise<string>;
  updateHourType: (id: string, updates: Partial<HourType>) => Promise<void>;
  deleteHourType: (id: string) => Promise<void>;
  initializeDefaultHourTypes: () => Promise<void>;
  refreshHourTypes: () => Promise<void>;
}

const HourTypesContext = createContext<HourTypesContextType | undefined>(undefined);

export function HourTypesProvider({ children }: { children: React.ReactNode }) {
  const [hourTypes, setHourTypes] = useState<HourType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadHourTypes();
    }
  }, [user]);

  const loadHourTypes = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const types = await getHourTypes(user.uid);
      setHourTypes(types);
    } catch (err) {
      console.error('Error loading hour types:', err);
      setError('שגיאה בטעינת סוגי השעות');
    } finally {
      setLoading(false);
    }
  };


  const createHourType = async (hourTypeData: CreateHourTypeForm): Promise<string> => {
    if (!user) throw new Error('משתמש לא מחובר');
    
    try {
      const id = await createHourTypeDB(user.uid, hourTypeData);
      await loadHourTypes(); // Refresh the list
      return id;
    } catch (err) {
      throw new Error('שגיאה ביצירת סוג השעות');
    }
  };

  const updateHourType = async (id: string, updates: Partial<HourType>): Promise<void> => {
    if (!user) throw new Error('משתמש לא מחובר');
    
    try {
      await updateHourTypeDB(user.uid, id, updates);
      await loadHourTypes(); // Refresh the list
    } catch (err) {
      throw new Error('שגיאה בעדכון סוג השעות');
    }
  };

  const deleteHourType = async (id: string): Promise<void> => {
    if (!user) throw new Error('משתמש לא מחובר');
    
    try {
      await deleteHourTypeDB(user.uid, id);
      await loadHourTypes(); // Refresh the list
    } catch (err) {
      throw new Error('שגיאה במחיקת סוג השעות');
    }
  };

  const initializeDefaultHourTypes = async (): Promise<void> => {
    if (!user) throw new Error('משתמש לא מחובר');
    
    try {
      for (const type of defaultHourTypes) {
        await createHourTypeDB(user.uid, type);
      }
      await loadHourTypes(); // Refresh the list
    } catch (err) {
      throw new Error('שגיאה ביצירת סוגי השעות המוגדרים מראש');
    }
  };

  const refreshHourTypes = async (): Promise<void> => {
    await loadHourTypes();
  };

  const value: HourTypesContextType = {
    hourTypes,
    loading,
    error,
    createHourType,
    updateHourType,
    deleteHourType,
    initializeDefaultHourTypes,
    refreshHourTypes
  };

  return (
    <HourTypesContext.Provider value={value}>
      {children}
    </HourTypesContext.Provider>
  );
}

export function useHourTypes() {
  const context = useContext(HourTypesContext);
  if (context === undefined) {
    throw new Error('useHourTypes must be used within a HourTypesProvider');
  }
  return context;
}