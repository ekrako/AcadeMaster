'use client';

import { useState, useEffect } from 'react';
import { Scenario, HourType, CreateScenarioForm, HourBank, ScenarioExport, ImportValidationResult } from '@/types';
import { useHourTypes } from '@/contexts/HourTypesContext';

export default function ScenarioManagerWorking() {
  const { hourTypes, loading: hourTypesLoading, createHourType } = useHourTypes();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CreateScenarioForm>({
    name: '',
    description: '',
  });
  const [hourBankData, setHourBankData] = useState<Record<string, number>>({});
  const [showImportModal, setShowImportModal] = useState(false);
  const [importValidation, setImportValidation] = useState<ImportValidationResult | null>(null);
  const [importData, setImportData] = useState<ScenarioExport | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!hourTypesLoading && hourTypes.length >= 0) {
      loadData();
    }
  }, [hourTypes, hourTypesLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      // Load scenarios from localStorage
      console.log('Loading scenarios...');
      
      setTimeout(() => {
        const stored = localStorage.getItem('academaster-scenarios');
        if (stored) {
          const parsedScenarios = JSON.parse(stored).map((scenario: any) => ({
            ...scenario,
            createdAt: new Date(scenario.createdAt),
            updatedAt: new Date(scenario.updatedAt)
          }));
          setScenarios(parsedScenarios);
        } else {
          // No scenarios exist yet
          setScenarios([]);
        }
        
        // Initialize hour bank data with zeros for all current hour types
        initializeHourBankData(hourTypes);
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading data:', error);
      setErrors({ general: 'שגיאה בטעינת הנתונים. אנא נסה שוב.' });
      setLoading(false);
    }
  };

  // Helper function to create hour banks from hour types
  const createHourBanksFromTypes = (hourTypes: HourType[], scenarioId: string): HourBank[] => {
    return hourTypes.map(hourType => ({
      id: `bank-${scenarioId}-${hourType.id}`,
      hourTypeId: hourType.id,
      totalHours: Math.floor(Math.random() * 50) + 10, // Mock data
      allocatedHours: Math.floor(Math.random() * 20), // Mock data
      remainingHours: 0
    })).map(bank => ({
      ...bank,
      remainingHours: bank.totalHours - bank.allocatedHours
    }));
  };

  // Helper function to initialize hour bank data
  const initializeHourBankData = (hourTypes: HourType[]) => {
    const initialHourBanks: Record<string, number> = {};
    hourTypes.forEach(hourType => {
      initialHourBanks[hourType.id] = 0;
    });
    setHourBankData(initialHourBanks);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'שם התרחיש הוא שדה חובה';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'שם התרחיש חייב להכיל לפחות 2 תווים';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'שם התרחיש לא יכול להכיל יותר מ-100 תווים';
    }

    // Check for duplicate names (excluding current edited scenario)
    const isDuplicate = scenarios.some(scenario => 
      scenario.name.toLowerCase() === formData.name.trim().toLowerCase() &&
      scenario.id !== editingScenario?.id
    );
    if (isDuplicate) {
      newErrors.name = 'תרחיש עם שם זה כבר קיים';
    }

    if (formData.description && formData.description.length > 300) {
      newErrors.description = 'התיאור לא יכול להכיל יותר מ-300 תווים';
    }

    // Validate hour banks - at least one should have hours
    const totalHours = Object.values(hourBankData).reduce((sum, hours) => sum + hours, 0);
    if (totalHours === 0) {
      newErrors.hourBanks = 'יש להקצות לפחות שעה אחת בבנק השעות';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create hour banks from current hour types and form data
      const hourBanks: HourBank[] = hourTypes.map(hourType => ({
        id: `${Date.now()}-${hourType.id}`,
        hourTypeId: hourType.id,
        totalHours: hourBankData[hourType.id] || 0,
        allocatedHours: 0,
        remainingHours: hourBankData[hourType.id] || 0
      }));

      const scenarioData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        isActive: false,
        hourBanks,
        teachers: [],
        classes: [],
        allocations: []
      };

      if (editingScenario) {
        // Update existing scenario
        const updatedScenarios = scenarios.map(s => 
          s.id === editingScenario.id 
            ? { ...s, ...scenarioData, updatedAt: new Date() }
            : s
        );
        setScenarios(updatedScenarios);
        // Save to localStorage
        localStorage.setItem('academaster-scenarios', JSON.stringify(updatedScenarios));
      } else {
        // Create new scenario
        const newScenario: Scenario = {
          id: Date.now().toString(),
          ...scenarioData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const updatedScenarios = [...scenarios, newScenario];
        setScenarios(updatedScenarios);
        // Save to localStorage
        localStorage.setItem('academaster-scenarios', JSON.stringify(updatedScenarios));
      }

      resetForm();
    } catch (error) {
      console.error('Error saving scenario:', error);
      setErrors({ general: 'שגיאה בשמירת התרחיש. אנא נסה שוב.' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (scenario: Scenario) => {
    setEditingScenario(scenario);
    setFormData({
      name: scenario.name,
      description: scenario.description || ''
    });
    
    // Set hour bank data from existing scenario and ensure all current hour types are included
    const currentHourBanks: Record<string, number> = {};
    
    // First, initialize all current hour types with 0
    hourTypes.forEach(hourType => {
      currentHourBanks[hourType.id] = 0;
    });
    
    // Then, set values from existing hour banks
    scenario.hourBanks.forEach(bank => {
      // Only set if the hour type still exists
      if (hourTypes.find(ht => ht.id === bank.hourTypeId)) {
        currentHourBanks[bank.hourTypeId] = bank.totalHours;
      }
    });
    
    setHourBankData(currentHourBanks);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק תרחיש זה?')) {
      try {
        const updatedScenarios = scenarios.filter(s => s.id !== id);
        setScenarios(updatedScenarios);
        // Save to localStorage
        localStorage.setItem('academaster-scenarios', JSON.stringify(updatedScenarios));
      } catch (error) {
        console.error('Error deleting scenario:', error);
        setErrors({ general: 'שגיאה במחיקת התרחיש. אנא נסה שוב.' });
      }
    }
  };

  const handleDuplicate = async (scenario: Scenario) => {
    const timestamp = Date.now();
    
    // Create hour banks based on current hour types, preserving quantities from original
    const newHourBanks: HourBank[] = hourTypes.map(hourType => {
      const originalBank = scenario.hourBanks.find(bank => bank.hourTypeId === hourType.id);
      return {
        id: `${timestamp}-bank-${hourType.id}`,
        hourTypeId: hourType.id,
        totalHours: originalBank?.totalHours || 0,
        allocatedHours: 0,
        remainingHours: originalBank?.totalHours || 0
      };
    });

    // Duplicate teachers with new IDs but preserve allocated hours structure
    const duplicatedTeachers = scenario.teachers.map(teacher => ({
      ...teacher,
      id: `${timestamp}-teacher-${Math.random().toString(36).substr(2, 9)}`,
      allocatedHours: 0 // Reset allocated hours since allocations will be reset
    }));

    // Duplicate classes with new IDs
    const duplicatedClasses = scenario.classes.map(cls => ({
      ...cls,
      id: `${timestamp}-class-${Math.random().toString(36).substr(2, 9)}`
    }));

    // Create teacher ID mapping for allocations
    const teacherIdMap = new Map<string, string>();
    scenario.teachers.forEach((originalTeacher, index) => {
      teacherIdMap.set(originalTeacher.id, duplicatedTeachers[index].id);
    });

    // Create class ID mapping for allocations
    const classIdMap = new Map<string, string>();
    scenario.classes.forEach((originalClass, index) => {
      classIdMap.set(originalClass.id, duplicatedClasses[index].id);
    });

    // Duplicate allocations with updated teacher and class IDs
    const duplicatedAllocations = scenario.allocations.map(allocation => {
      // Handle both old classId and new classIds format
      let newClassIds: string[] = [];
      if (allocation.classIds && allocation.classIds.length > 0) {
        newClassIds = allocation.classIds.map(classId => classIdMap.get(classId) || classId);
      } else if (allocation.classId) {
        const newClassId = classIdMap.get(allocation.classId) || allocation.classId;
        newClassIds = [newClassId];
      }

      return {
        ...allocation,
        id: `${timestamp}-allocation-${Math.random().toString(36).substr(2, 9)}`,
        teacherId: teacherIdMap.get(allocation.teacherId) || allocation.teacherId,
        classId: newClassIds.length > 0 ? newClassIds[0] : '', // Backward compatibility
        classIds: newClassIds,
        createdAt: new Date()
      };
    });

    // Update hour banks with allocated hours from duplicated allocations
    duplicatedAllocations.forEach(allocation => {
      const bankIndex = newHourBanks.findIndex(bank => bank.hourTypeId === allocation.hourTypeId);
      if (bankIndex >= 0) {
        newHourBanks[bankIndex].allocatedHours += allocation.hours;
        newHourBanks[bankIndex].remainingHours -= allocation.hours;
      }
    });

    // Update teacher allocated hours
    duplicatedAllocations.forEach(allocation => {
      const teacherIndex = duplicatedTeachers.findIndex(teacher => teacher.id === allocation.teacherId);
      if (teacherIndex >= 0) {
        duplicatedTeachers[teacherIndex].allocatedHours += allocation.hours;
      }
    });

    const duplicatedScenario: Scenario = {
      ...scenario,
      id: timestamp.toString(),
      name: `${scenario.name} - עותק`,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      allocations: duplicatedAllocations,
      hourBanks: newHourBanks,
      teachers: duplicatedTeachers,
      classes: duplicatedClasses
    };
    
    const updatedScenarios = [...scenarios, duplicatedScenario];
    setScenarios(updatedScenarios);
    // Save to localStorage
    localStorage.setItem('academaster-scenarios', JSON.stringify(updatedScenarios));
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingScenario(null);
    // Reset hour bank data to zeros for all current hour types
    initializeHourBankData(hourTypes);
    setShowForm(false);
    setErrors({});
  };

  const handleHourBankChange = (hourTypeId: string, hours: number) => {
    setHourBankData(prev => ({
      ...prev,
      [hourTypeId]: Math.max(0, hours)
    }));
  };

  const handleExport = async (scenarioId: string) => {
    try {
      const scenario = scenarios.find(s => s.id === scenarioId);
      if (!scenario) {
        alert('תרחיש לא נמצא');
        return;
      }
      
      // Get hour types that have allocated hours (non-zero total hours)
      const allocatedHourBanks = scenario.hourBanks.filter(bank => bank.totalHours > 0);
      const hourTypeIds = allocatedHourBanks.map(bank => bank.hourTypeId);
      const scenarioHourTypes = hourTypes.filter(ht => hourTypeIds.includes(ht.id));
      
      const exportData: ScenarioExport = {
        scenario: {
          ...scenario,
          hourBanks: allocatedHourBanks
        },
        hourTypes: scenarioHourTypes,
        exportedAt: new Date(),
        version: '1.0'
      };
      
      const filename = `${scenario.name}-${new Date().toISOString().split('T')[0]}.json`;
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting scenario:', error);
      alert('שגיאה בייצוא התרחיש');
    }
  };

  const validateScenarioImport = (exportData: ScenarioExport): ImportValidationResult => {
    const missingHourTypes: HourType[] = [];
    const existingHourTypesInImport: HourType[] = [];
    const warnings: string[] = [];
    
    // Check which hour types are missing
    for (const hourType of exportData.hourTypes) {
      const exists = hourTypes.find(ht => 
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
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data: ScenarioExport = JSON.parse(text);
      
      // Convert date strings back to Date objects
      data.scenario.createdAt = new Date(data.scenario.createdAt);
      data.scenario.updatedAt = new Date(data.scenario.updatedAt);
      data.exportedAt = new Date(data.exportedAt);
      data.scenario.allocations = data.scenario.allocations.map(allocation => ({
        ...allocation,
        createdAt: new Date(allocation.createdAt)
      }));
      data.hourTypes = data.hourTypes.map(hourType => ({
        ...hourType,
        createdAt: new Date(hourType.createdAt),
        updatedAt: new Date(hourType.updatedAt)
      }));
      
      const validation = validateScenarioImport(data);
      setImportData(data);
      setImportValidation(validation);
      setShowImportModal(true);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('שגיאה בקריאת הקובץ. ודא שזהו קובץ JSON תקין.');
    }
    
    // Reset file input
    event.target.value = '';
  };

  const handleImport = async () => {
    if (!importData) return;
    
    setImporting(true);
    try {
      // Create missing hour types automatically
      if (importValidation?.missingHourTypes.length) {
        for (const hourType of importValidation.missingHourTypes) {
          await createHourType({
            name: hourType.name,
            description: hourType.description,
            color: hourType.color,
            isClassHour: hourType.isClassHour
          });
        }
        // Wait a bit for the context to update
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Get current hour types to map IDs (refresh to include newly created ones)
      const currentHourTypes = [...hourTypes];
      
      // Add any newly created hour types to the current list
      for (const hourType of importData.hourTypes) {
        const exists = currentHourTypes.find(ht => ht.name === hourType.name);
        if (!exists) {
          // This hour type was just created, add it to our working list
          currentHourTypes.push({
            ...hourType,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9) // Generate a new ID
          });
        }
      }
      
      const hourTypeIdMap = new Map<string, string>();
      
      // Map old IDs to new IDs
      for (const hourType of importData.hourTypes) {
        const current = currentHourTypes.find(ht => ht.name === hourType.name);
        if (current) {
          hourTypeIdMap.set(hourType.id, current.id);
        }
      }
      
      // Create the scenario with updated hour type IDs
      const timestamp = Date.now();
      const newScenario: Scenario = {
        ...importData.scenario,
        id: timestamp.toString(),
        name: `${importData.scenario.name} (מיובא)`,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        hourBanks: importData.scenario.hourBanks.map(bank => ({
          ...bank,
          id: `${timestamp}-${bank.hourTypeId}`,
          hourTypeId: hourTypeIdMap.get(bank.hourTypeId) || bank.hourTypeId
        })),
        allocations: importData.scenario.allocations.map(allocation => ({
          ...allocation,
          id: timestamp.toString() + Math.random().toString(36).substr(2, 9),
          hourTypeId: hourTypeIdMap.get(allocation.hourTypeId) || allocation.hourTypeId,
          createdAt: new Date()
        }))
      };
      
      const updatedScenarios = [...scenarios, newScenario];
      setScenarios(updatedScenarios);
      localStorage.setItem('academaster-scenarios', JSON.stringify(updatedScenarios));
      
      setShowImportModal(false);
      setImportData(null);
      setImportValidation(null);
      alert('התרחיש יובא בהצלחה!');
    } catch (error) {
      console.error('Error importing scenario:', error);
      alert('שגיאה בייבוא התרחיש');
    } finally {
      setImporting(false);
    }
  };

  if (loading || hourTypesLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">
          {hourTypesLoading ? 'טוען סוגי שעות...' : 'טוען תרחישים...'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">ניהול תרחישים</h2>
          <p className="text-gray-600 text-sm mt-1">
            צור ונהל תרחישי הקצאת שעות שונים (גרסת בדיקה)
          </p>
        </div>
        <div className="flex gap-3">
          <label className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap">
            📥 יבא תרחיש
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg whitespace-nowrap"
            disabled={hourTypes.length === 0}
          >
            צור תרחיש חדש
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{errors.general}</p>
          <button
            onClick={() => {
              setErrors({});
              loadData();
            }}
            className="mt-2 text-red-600 underline hover:text-red-800"
          >
            נסה שוב
          </button>
        </div>
      )}

      {hourTypes.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            יש להגדיר סוגי שעות לפני יצירת תרחישים. 
            <a href="/hour-types" className="underline mr-2">לחץ כאן להגדרת סוגי שעות</a>
          </p>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border">
          <h3 className="text-lg font-semibold mb-4">
            {editingScenario ? 'עריכת תרחיש' : 'יצירת תרחיש חדש'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">שם התרחיש *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500 bg-red-50' : ''
                  }`}
                  placeholder="לדוגמה: תרחיש שנה א׳ תשפ״ה"
                  required
                  maxLength={100}
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  {formData.name.length}/100 תווים
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">תיאור (אופציונלי)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.description ? 'border-red-500 bg-red-50' : ''
                  }`}
                  placeholder="תיאור קצר של התרחיש"
                  rows={3}
                  maxLength={300}
                />
                {errors.description && (
                  <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  {formData.description?.length || 0}/300 תווים
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-md font-semibold mb-3">הגדרת בנק שעות לתרחיש *</h4>
              <p className="text-sm text-gray-600 mb-4">
                בנק השעות נוצר אוטומטית מסוגי השעות הקיימים. הגדר כמות שעות לכל סוג.
              </p>
              {hourTypes.length === 0 ? (
                <div className="col-span-full bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-yellow-800">
                    אין סוגי שעות מוגדרים. 
                    <a href="/hour-types" className="underline mr-2">לחץ כאן להגדרת סוגי שעות</a>
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hourTypes.map(hourType => (
                  <div key={hourType.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: hourType.color }}
                      />
                      <label className="font-medium text-sm">{hourType.name}</label>
                    </div>
                    {hourType.description && (
                      <p className="text-xs text-gray-500 mb-2">{hourType.description}</p>
                    )}
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={hourBankData[hourType.id] || 0}
                      onChange={(e) => handleHourBankChange(hourType.id, parseInt(e.target.value) || 0)}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="מספר שעות"
                    />
                    </div>
                  ))}
                </div>
              )}
              {errors.hourBanks && (
                <p className="text-red-600 text-sm mt-2">{errors.hourBanks}</p>
              )}
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>סה״כ שעות:</strong> {Object.values(hourBankData).reduce((sum, hours) => sum + hours, 0)} שעות
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg flex items-center gap-2"
              >
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                {saving ? 'שומר...' : (editingScenario ? 'עדכן תרחיש' : 'צור תרחיש')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6">
        {/* Statistics */}
        {scenarios.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-800">
                סה״כ תרחישים: <strong>{scenarios.length}</strong>
              </span>
              <span className="text-blue-600">
                פעילים: <strong>{scenarios.filter(s => s.isActive).length}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {scenarios.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין תרחישים מוגדרים</h3>
            <p className="text-gray-500 mb-4">צור תרחיש ראשון כדי להתחיל</p>
            <button
              onClick={() => setShowForm(true)}
              disabled={hourTypes.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg"
            >
              צור תרחיש ראשון
            </button>
          </div>
        ) : (
          scenarios.map(scenario => (
            <div key={scenario.id} className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{scenario.name}</h3>
                    {scenario.isActive && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        פעיל
                      </span>
                    )}
                  </div>
                  {scenario.description && (
                    <p className="text-gray-600 mt-1">{scenario.description}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    נוצר: {scenario.createdAt.toLocaleDateString('he-IL')} |
                    עודכן: {scenario.updatedAt.toLocaleDateString('he-IL')}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.href = `/scenario?id=${scenario.id}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium"
                    title="פתח תרחיש"
                  >
                    📂 פתח
                  </button>
                  <button
                    onClick={() => handleEdit(scenario)}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-sm font-medium"
                    title="ערוך תרחיש"
                  >
                    ✏️ עריכה
                  </button>
                  <button
                    onClick={() => handleExport(scenario.id)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-sm font-medium"
                    title="ייצא תרחיש"
                  >
                    📤 ייצא
                  </button>
                  <button
                    onClick={() => handleDuplicate(scenario)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium"
                    title="שכפל תרחיש"
                  >
                    📋 שכפל
                  </button>
                  <button
                    onClick={() => handleDelete(scenario.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm font-medium"
                    title="מחק תרחיש"
                  >
                    🗑️ מחק
                  </button>
                </div>
              </div>

              {/* Hour Banks Summary */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">בנק שעות:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {scenario.hourBanks.map(bank => {
                    const hourType = hourTypes.find(ht => ht.id === bank.hourTypeId);
                    if (!hourType) return null;
                    
                    const utilizationPercent = bank.totalHours > 0 ? (bank.allocatedHours / bank.totalHours) * 100 : 0;
                    
                    return (
                      <div key={bank.id} className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: hourType.color }}
                          />
                          <span className="text-sm font-medium">{hourType.name}</span>
                        </div>
                        <div className="text-lg font-bold">
                          {bank.remainingHours}/{bank.totalHours}
                        </div>
                        <div className="text-xs text-gray-600">נותרו/סה״כ</div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{ width: `${utilizationPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{scenario.teachers.length}</div>
                  <div className="text-sm text-gray-600">מורים</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{scenario.classes.length}</div>
                  <div className="text-sm text-gray-600">כיתות</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{scenario.allocations.length}</div>
                  <div className="text-sm text-gray-600">הקצאות</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && importValidation && importData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">יבוא תרחיש</h3>
            
            <div className="mb-4">
              <h4 className="font-semibold text-lg">{importData.scenario.name}</h4>
              <p className="text-gray-600 text-sm">
                ייצא ב: {new Date(importData.exportedAt).toLocaleDateString('he-IL')}
              </p>
            </div>

            {importValidation.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h5 className="font-medium text-yellow-800 mb-2">אזהרות:</h5>
                <ul className="list-disc list-inside text-yellow-700 text-sm">
                  {importValidation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {importValidation.missingHourTypes.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h5 className="font-medium text-red-800 mb-2">סוגי שעות חסרים:</h5>
                <div className="space-y-2">
                  {importValidation.missingHourTypes.map((hourType) => (
                    <div key={hourType.id} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: hourType.color }}
                      />
                      <span className="text-sm">{hourType.name}</span>
                      {hourType.description && (
                        <span className="text-xs text-gray-500">({hourType.description})</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-red-700 text-sm mt-2">
                  סוגי השעות החסרים ייווצרו אוטומטית בייבוא.
                </p>
              </div>
            )}

            {importValidation.existingHourTypes.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h5 className="font-medium text-green-800 mb-2">סוגי שעות קיימים:</h5>
                <div className="space-y-1">
                  {importValidation.existingHourTypes.map((hourType) => (
                    <div key={hourType.id} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: hourType.color }}
                      />
                      <span className="text-sm">{hourType.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h5 className="font-medium mb-2">תוכן התרחיש:</h5>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {importData.scenario.teachers.length}
                  </div>
                  <div>מורים</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {importData.scenario.classes.length}
                  </div>
                  <div>כיתות</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {importData.scenario.allocations.length}
                  </div>
                  <div>הקצאות</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportData(null);
                  setImportValidation(null);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                disabled={importing}
              >
                ביטול
              </button>
              
              <button
                onClick={() => handleImport()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                disabled={importing}
              >
                {importing ? 'מייבא...' : importValidation.missingHourTypes.length > 0 ? 'יבא תרחיש וצור סוגי שעות' : 'יבא תרחיש'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}