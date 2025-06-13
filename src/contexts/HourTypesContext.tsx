'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { HourType, CreateHourTypeForm } from '@/types';
import { defaultHourTypes } from '@/lib/defaultData';

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

  useEffect(() => {
    loadHourTypes();
  }, []);

  const loadHourTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate loading - in real implementation this would call Firebase
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if we have hour types in localStorage for persistence
      const stored = localStorage.getItem('academaster-hour-types');
      if (stored) {
        const parsedTypes = JSON.parse(stored).map((type: any) => ({
          ...type,
          createdAt: new Date(type.createdAt),
          updatedAt: new Date(type.updatedAt)
        }));
        setHourTypes(parsedTypes);
      } else {
        // Start with empty array - user can initialize defaults
        setHourTypes([]);
      }
    } catch (err) {
      console.error('Error loading hour types:', err);
      setError('שגיאה בטעינת סוגי השעות');
    } finally {
      setLoading(false);
    }
  };

  const saveToStorage = (types: HourType[]) => {
    localStorage.setItem('academaster-hour-types', JSON.stringify(types));
  };

  const createHourType = async (hourTypeData: CreateHourTypeForm): Promise<string> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newHourType: HourType = {
        id: Date.now().toString(),
        ...hourTypeData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const updatedTypes = [...hourTypes, newHourType];
      setHourTypes(updatedTypes);
      saveToStorage(updatedTypes);
      
      return newHourType.id;
    } catch (err) {
      throw new Error('שגיאה ביצירת סוג השעות');
    }
  };

  const updateHourType = async (id: string, updates: Partial<HourType>): Promise<void> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedTypes = hourTypes.map(type =>
        type.id === id
          ? { ...type, ...updates, updatedAt: new Date() }
          : type
      );
      
      setHourTypes(updatedTypes);
      saveToStorage(updatedTypes);
    } catch (err) {
      throw new Error('שגיאה בעדכון סוג השעות');
    }
  };

  const deleteHourType = async (id: string): Promise<void> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedTypes = hourTypes.filter(type => type.id !== id);
      setHourTypes(updatedTypes);
      saveToStorage(updatedTypes);
    } catch (err) {
      throw new Error('שגיאה במחיקת סוג השעות');
    }
  };

  const initializeDefaultHourTypes = async (): Promise<void> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTypes: HourType[] = defaultHourTypes.map((type, index) => ({
        id: (Date.now() + index).toString(),
        ...type,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      setHourTypes(newTypes);
      saveToStorage(newTypes);
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