'use client';

import { useState, useEffect } from 'react';
import { Scenario, Teacher, HourBank, Allocation } from '@/types';
import { useHourTypes } from '@/contexts/HourTypesContext';

interface AllocationManagerWorkingProps {
  scenario: Scenario;
  onUpdate: (scenario: Scenario) => void;
  preSelectedTeacher?: Teacher;
}

export default function AllocationManagerWorking({ scenario, onUpdate, preSelectedTeacher }: AllocationManagerWorkingProps) {
  const { hourTypes } = useHourTypes();
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [allocations, setAllocations] = useState<Record<string, { 
    generalHours: number; 
    classAllocations: Record<string, number> 
  }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAllocationForm, setShowAllocationForm] = useState(false);
  const [sessionAddedHourTypes, setSessionAddedHourTypes] = useState<Set<string>>(new Set());
  const [sessionAddedClasses, setSessionAddedClasses] = useState<Record<string, Set<string>>>({}); // hourTypeId -> Set of classIds

  // Auto-select teacher if provided
  useEffect(() => {
    if (preSelectedTeacher) {
      setSelectedTeacher(preSelectedTeacher);
      setShowAllocationForm(true);
    }
  }, [preSelectedTeacher]);

  useEffect(() => {
    if (selectedTeacher) {
      // Initialize allocations for the selected teacher
      const teacherAllocations: Record<string, { 
        generalHours: number; 
        classAllocations: Record<string, number> 
      }> = {};
      
      hourTypes.forEach(hourType => {
        // Find existing allocations for this teacher and hour type
        const existingAllocations = scenario.allocations.filter(
          a => a.teacherId === selectedTeacher.id && a.hourTypeId === hourType.id
        );
        
        let generalHours = 0;
        const classAllocations: Record<string, number> = {};
        
        existingAllocations.forEach(allocation => {
          // Check if this is a class-specific allocation
          const hasClasses = (allocation.classIds && allocation.classIds.length > 0) || allocation.classId;
          
          if (hasClasses) {
            // Handle both old classId and new classIds format
            if (allocation.classIds && allocation.classIds.length > 0) {
              // For multi-class allocations, distribute hours evenly (legacy support)
              const hoursPerClass = allocation.hours / allocation.classIds.length;
              allocation.classIds.forEach(classId => {
                classAllocations[classId] = (classAllocations[classId] || 0) + hoursPerClass;
              });
            } else if (allocation.classId) {
              classAllocations[allocation.classId] = (classAllocations[allocation.classId] || 0) + allocation.hours;
            }
          } else {
            // General allocation (no specific class)
            generalHours += allocation.hours;
          }
        });
        
        teacherAllocations[hourType.id] = {
          generalHours,
          classAllocations
        };
      });
      setAllocations(teacherAllocations);
    }
  }, [selectedTeacher, hourTypes, scenario.allocations]);

  const getAvailableHours = (hourTypeId: string): number => {
    const hourBank = scenario.hourBanks.find(bank => bank.hourTypeId === hourTypeId);
    return hourBank ? hourBank.remainingHours : 0;
  };

  const getTotalAllocatedToTeacher = (teacherId: string): number => {
    return scenario.allocations
      .filter(a => a.teacherId === teacherId)
      .reduce((sum, a) => sum + a.hours, 0);
  };

  const getTotalHoursForHourType = (hourTypeId: string): number => {
    const allocation = allocations[hourTypeId];
    if (!allocation) return 0;
    
    const classHours = Object.values(allocation.classAllocations).reduce((sum, hours) => sum + hours, 0);
    return allocation.generalHours + classHours;
  };

  const getTotalHoursForTeacher = (): number => {
    return Object.keys(allocations).reduce((total, hourTypeId) => {
      return total + getTotalHoursForHourType(hourTypeId);
    }, 0);
  };

  const validateAllocation = (hourTypeId: string, hours: number, isClassHour = false, classId?: string): string | null => {
    if (hours < 0) return 'מספר השעות לא יכול להיות שלילי';
    if (hours > 40) return 'לא ניתן להקצות יותר מ-40 שעות לכיתה אחת';
    
    if (!selectedTeacher) return null;
    
    // Get hour type and allocation info for calculations
    const hourType = hourTypes.find(ht => ht.id === hourTypeId);
    const allocation = allocations[hourTypeId];
    
    // Calculate total hours for this hour type including this change
    const currentHoursForType = getTotalHoursForHourType(hourTypeId);
    const currentGeneralHours = allocation?.generalHours || 0;
    const currentClassHours = Object.values(allocation?.classAllocations || {}).reduce((sum, h) => sum + h, 0);
    
    let totalForTypeWithChange;
    if (isClassHour && classId) {
      // For class hour changes, keep general hours and adjust only the specific class
      const currentClassHours = allocation?.classAllocations[classId] || 0;
      const newClassTotal = Object.entries(allocation?.classAllocations || {})
        .reduce((sum, [cId, h]) => sum + (cId === classId ? hours : h), 0);
      totalForTypeWithChange = currentGeneralHours + newClassTotal;
    } else {
      // For general hour changes, keep class hours as they are
      totalForTypeWithChange = hours + currentClassHours;
    }
    
    const available = getAvailableHours(hourTypeId);
    if (totalForTypeWithChange > available) {
      return `זמינות רק ${available} שעות מסוג זה (כבר מוקצות ${currentHoursForType})`;
    }
    
    // Calculate total hours for teacher including this change
    const currentTotalHours = getTotalHoursForTeacher();
    const changeInHours = totalForTypeWithChange - currentHoursForType;
    const totalWithChange = currentTotalHours + changeInHours;
    
    if (totalWithChange > selectedTeacher.maxHours) {
      return `סה"כ שעות למורה (${totalWithChange}) עולה על המקסימום (${selectedTeacher.maxHours})`;
    }

    return null;
  };

  const handleGeneralHoursChange = (hourTypeId: string, hours: number) => {
    const currentAllocation = allocations[hourTypeId] || { generalHours: 0, classAllocations: {} };
    const updatedAllocation = {
      ...currentAllocation,
      generalHours: hours
    };
    
    const error = validateAllocation(hourTypeId, hours, false);
    if (error) {
      setErrors({ ...errors, [hourTypeId]: error });
    } else {
      setErrors({ ...errors, [hourTypeId]: '' });
    }
    
    setAllocations({ ...allocations, [hourTypeId]: updatedAllocation });
  };

  const handleClassHoursChange = (hourTypeId: string, classId: string, hours: number) => {
    const currentAllocation = allocations[hourTypeId] || { generalHours: 0, classAllocations: {} };
    const updatedClassAllocations = { ...currentAllocation.classAllocations };
    
    if (hours > 0) {
      updatedClassAllocations[classId] = hours;
    } else {
      // Keep class with 0 hours if it's in session state, otherwise delete it
      if (sessionAddedClasses[hourTypeId]?.has(classId)) {
        updatedClassAllocations[classId] = 0;
      } else {
        delete updatedClassAllocations[classId];
      }
    }
    
    const updatedAllocation = {
      ...currentAllocation,
      classAllocations: updatedClassAllocations
    };
    
    const error = validateAllocation(hourTypeId, hours, true, classId);
    if (error) {
      setErrors({ ...errors, [`${hourTypeId}-${classId}`]: error });
    } else {
      setErrors({ ...errors, [`${hourTypeId}-${classId}`]: '' });
    }
    
    setAllocations({ ...allocations, [hourTypeId]: updatedAllocation });
  };

  const saveAllocations = () => {
    if (!selectedTeacher) return;

    const newAllocations: Allocation[] = [];
    const updatedHourBanks = [...scenario.hourBanks];
    const updatedTeachers = [...scenario.teachers];

    // Remove existing allocations for this teacher
    const filteredAllocations = scenario.allocations.filter(a => a.teacherId !== selectedTeacher.id);

    // Reset hour banks for this teacher's previous allocations
    scenario.allocations
      .filter(a => a.teacherId === selectedTeacher.id)
      .forEach(allocation => {
        const bankIndex = updatedHourBanks.findIndex(bank => bank.hourTypeId === allocation.hourTypeId);
        if (bankIndex >= 0) {
          updatedHourBanks[bankIndex] = {
            ...updatedHourBanks[bankIndex],
            allocatedHours: updatedHourBanks[bankIndex].allocatedHours - allocation.hours,
            remainingHours: updatedHourBanks[bankIndex].remainingHours + allocation.hours
          };
        }
      });

    // Create new allocations and update hour banks
    Object.entries(allocations).forEach(([hourTypeId, allocation]) => {
      let totalHoursForType = 0;
      
      // Create general allocation if there are general hours
      if (allocation.generalHours > 0) {
        newAllocations.push({
          id: `${Date.now()}-${selectedTeacher.id}-${hourTypeId}-general`,
          teacherId: selectedTeacher.id,
          classId: '', // No specific class
          classIds: [], // No specific classes
          hourTypeId,
          hours: allocation.generalHours,
          createdAt: new Date(),
          notes: ''
        });
        totalHoursForType += allocation.generalHours;
      }
      
      // Create separate allocation for each class
      Object.entries(allocation.classAllocations).forEach(([classId, hours]) => {
        if (hours > 0) {
          newAllocations.push({
            id: `${Date.now()}-${selectedTeacher.id}-${hourTypeId}-${classId}`,
            teacherId: selectedTeacher.id,
            classId: classId,
            classIds: [classId], // Single class per allocation
            hourTypeId,
            hours: hours,
            createdAt: new Date(),
            notes: ''
          });
          totalHoursForType += hours;
        }
      });

      // Update hour bank with total hours for this hour type
      if (totalHoursForType > 0) {
        const bankIndex = updatedHourBanks.findIndex(bank => bank.hourTypeId === hourTypeId);
        if (bankIndex >= 0) {
          updatedHourBanks[bankIndex] = {
            ...updatedHourBanks[bankIndex],
            allocatedHours: updatedHourBanks[bankIndex].allocatedHours + totalHoursForType,
            remainingHours: updatedHourBanks[bankIndex].remainingHours - totalHoursForType
          };
        }
      }
    });

    // Update teacher's allocated hours
    const teacherIndex = updatedTeachers.findIndex(t => t.id === selectedTeacher.id);
    if (teacherIndex >= 0) {
      const totalAllocatedHours = getTotalHoursForTeacher();
      updatedTeachers[teacherIndex] = {
        ...updatedTeachers[teacherIndex],
        allocatedHours: totalAllocatedHours
      };
    }

    const updatedScenario: Scenario = {
      ...scenario,
      allocations: [...filteredAllocations, ...newAllocations],
      hourBanks: updatedHourBanks,
      teachers: updatedTeachers,
      updatedAt: new Date()
    };

    onUpdate(updatedScenario);
    if (!preSelectedTeacher) {
      setShowAllocationForm(false);
      setSelectedTeacher(null);
      setSessionAddedHourTypes(new Set());
      setSessionAddedClasses({});
    }
  };

  const getHourTypeColor = (hourTypeId: string): string => {
    const hourType = hourTypes.find(ht => ht.id === hourTypeId);
    return hourType?.color || '#6B7280';
  };

  const getHourTypeName = (hourTypeId: string): string => {
    const hourType = hourTypes.find(ht => ht.id === hourTypeId);
    return hourType?.name || 'לא ידוע';
  };

  const getClassNames = (allocation: Allocation): string => {
    const classIds = allocation.classIds || (allocation.classId ? [allocation.classId] : []);
    if (classIds.length === 0) return '';
    
    const classNames = classIds
      .map(classId => {
        const cls = scenario.classes.find(c => c.id === classId);
        return cls ? cls.name : '';
      })
      .filter(name => name);
    
    if (classNames.length === 0) return '';
    if (classNames.length === 1) return classNames[0];
    if (classNames.length <= 3) return classNames.join(', ');
    return `${classNames.slice(0, 2).join(', ')} +${classNames.length - 2}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold">הקצאת שעות</h3>
          <p className="text-gray-600 text-sm mt-1">
            הקצה שעות ממאגר השעות למורים
          </p>
        </div>
      </div>

      {/* Hour Banks Overview */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h4 className="text-lg font-semibold mb-4">מצב מאגר השעות</h4>
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
          {scenario.hourBanks.map(bank => {
            const hourType = hourTypes.find(ht => ht.id === bank.hourTypeId);
            if (!hourType) return null;
            
            const utilizationPercent = (bank.totalHours || 0) > 0 ? ((bank.allocatedHours || 0) / (bank.totalHours || 1)) * 100 : 0;
            
            return (
              <div key={bank.id} className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: hourType.color }}
                  />
                  <span className="font-medium">{hourType.name}</span>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {bank.remainingHours || 0}/{bank.totalHours || 0}
                </div>
                <div className="text-sm text-gray-600 mb-2">שעות נותרו/סה״כ</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all" 
                    style={{ width: `${Math.min(utilizationPercent || 0, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round(utilizationPercent || 0)}% בשימוש
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Teachers List */}
      {!preSelectedTeacher && (
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h4 className="text-lg font-semibold mb-4">מורים ברשימה</h4>
        {scenario.teachers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            אין מורים מוגדרים בתרחיש זה. יש להוסיף מורים תחילה.
          </div>
        ) : (
          <div className="grid gap-4">
            {scenario.teachers.map(teacher => {
              const totalAllocated = getTotalAllocatedToTeacher(teacher.id) || 0;
              const maxHours = teacher.maxHours || 25;
              const utilizationPercent = maxHours > 0 ? (totalAllocated / maxHours) * 100 : 0;
              const isOverAllocated = totalAllocated > maxHours;
              
              return (
                <div key={teacher.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-semibold text-lg">{teacher.name}</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-gray-500">מס׳ ת.ז.:</span> {teacher.idNumber}
                        </div>
                        {teacher.subject && (
                          <div>
                            <span className="text-gray-500">מקצוע:</span> {teacher.subject}
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">שעות מוקצות:</span>
                          <span className={`font-medium mr-1 ${isOverAllocated ? 'text-red-600' : 'text-green-600'}`}>
                            {totalAllocated}/{maxHours}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">ניצולת:</span>
                          <span className={`font-medium mr-1 ${isOverAllocated ? 'text-red-600' : 'text-blue-600'}`}>
                            {Math.round(utilizationPercent || 0)}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Hour Type Breakdown */}
                      {totalAllocated > 0 && (
                        <div className="mt-3">
                          <div className="text-sm text-gray-600 mb-2">פירוט הקצאות:</div>
                          <div className="flex flex-wrap gap-2">
                            {scenario.allocations
                              .filter(a => a.teacherId === teacher.id)
                              .map(allocation => {
                                const classNames = getClassNames(allocation);
                                return (
                                  <span
                                    key={allocation.id}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
                                    style={{ 
                                      backgroundColor: `${getHourTypeColor(allocation.hourTypeId)}20`,
                                      color: getHourTypeColor(allocation.hourTypeId)
                                    }}
                                    title={classNames ? `כיתות: ${classNames}` : undefined}
                                  >
                                    {getHourTypeName(allocation.hourTypeId)}: {allocation.hours}
                                    {classNames && (
                                      <span className="text-xs opacity-75">
                                        ({classNames})
                                      </span>
                                    )}
                                  </span>
                                );
                              })
                            }
                          </div>
                        </div>
                      )}
                      
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              isOverAllocated ? 'bg-red-600' : 'bg-green-600'
                            }`}
                            style={{ width: `${Math.min(utilizationPercent || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mr-4">
                      <button
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          setShowAllocationForm(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                      >
                        הקצה שעות
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      )}

      {/* Allocation Form Modal */}
      {showAllocationForm && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-semibold mb-4">
              הקצאת שעות ל{selectedTeacher.name}
            </h3>
            
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-800">שעות מקסימליות:</span>
                  <strong className="text-blue-900 mr-1">{selectedTeacher.maxHours}</strong>
                </div>
                <div>
                  <span className="text-blue-800">שעות מוקצות כעת:</span>
                  <strong className="text-blue-900 mr-1">
                    {getTotalHoursForTeacher()}
                  </strong>
                </div>
              </div>
            </div>

            {/* Add Hour Type Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium">הקצאות שעות</h4>
                <select
                  onChange={(e) => {
                    const hourTypeId = e.target.value;
                    if (hourTypeId && (!allocations[hourTypeId] || getTotalHoursForHourType(hourTypeId) === 0)) {
                      const hourType = hourTypes.find(ht => ht.id === hourTypeId);
                      
                      // Add to session state to keep it visible even with 0 hours
                      setSessionAddedHourTypes(prev => new Set([...prev, hourTypeId]));
                      
                      if (hourType?.isClassHour) {
                        // For class hour types, start with 0 hours
                        // User can then choose to allocate to specific classes
                        const newAllocations = {
                          ...allocations,
                          [hourTypeId]: { 
                            generalHours: 0, 
                            classAllocations: {}
                          }
                        };
                        setAllocations(newAllocations);
                      } else {
                        // For regular hour types, start with 0 hours
                        const newAllocations = {
                          ...allocations,
                          [hourTypeId]: { 
                            generalHours: 0, 
                            classAllocations: {} 
                          }
                        };
                        setAllocations(newAllocations);
                      }
                    }
                    e.target.value = '';
                  }}
                  className="text-sm border rounded px-3 py-2 bg-blue-600 text-white hover:bg-blue-700"
                  value=""
                >
                  <option value="">+ הוסף סוג שעות</option>
                  {hourTypes
                    .filter(ht => (!allocations[ht.id] || getTotalHoursForHourType(ht.id) === 0) && !sessionAddedHourTypes.has(ht.id))
                    .map(hourType => (
                      <option key={hourType.id} value={hourType.id}>
                        {hourType.name} ({getAvailableHours(hourType.id)} זמינות)
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {Object.keys(allocations).filter(hourTypeId => getTotalHoursForHourType(hourTypeId) > 0 || sessionAddedHourTypes.has(hourTypeId)).length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-4xl mb-2">⏰</div>
                  <p className="text-lg font-medium mb-1">אין הקצאות שעות</p>
                  <p className="text-sm">השתמש בכפתור "הוסף סוג שעות" למעלה להתחיל</p>
                </div>
              )}
              
              {Object.keys(allocations)
                .filter(hourTypeId => getTotalHoursForHourType(hourTypeId) > 0 || sessionAddedHourTypes.has(hourTypeId))
                .map(hourTypeId => {
                  const hourType = hourTypes.find(ht => ht.id === hourTypeId);
                  if (!hourType) return null;
                  
                  const available = getAvailableHours(hourType.id);
                  const allocation = allocations[hourType.id] || { generalHours: 0, classAllocations: {} };
                  const error = errors[hourType.id];
                  const totalHours = getTotalHoursForHourType(hourType.id);
                  
                  return (
                    <div key={hourType.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: hourType.color }}
                          />
                          <h4 className="font-medium">{hourType.name}</h4>
                          {hourType.isClassHour && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              שעות כיתה
                            </span>
                          )}
                          <span className="text-sm text-gray-500">
                            (זמינות: {available} שעות)
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            const updatedAllocations = { ...allocations };
                            delete updatedAllocations[hourType.id];
                            setAllocations(updatedAllocations);
                            // Remove from session state so it can be re-added
                            setSessionAddedHourTypes(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(hourType.id);
                              return newSet;
                            });
                            // Clear any errors for this hour type
                            const updatedErrors = { ...errors };
                            Object.keys(updatedErrors).forEach(key => {
                              if (key.startsWith(hourType.id)) {
                                delete updatedErrors[key];
                              }
                            });
                            setErrors(updatedErrors);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                          title="הסר סוג שעות"
                        >
                          הסר
                        </button>
                      </div>
                    
                    <div className="space-y-4">
                      {/* Summary and Progress */}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">סה"כ שעות מוקצות:</span>
                          <span className="font-bold">{totalHours}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all" 
                            style={{ 
                              width: (available || 0) > 0 ? `${Math.min((totalHours / (available || 1)) * 100, 100)}%` : '0%' 
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {totalHours} מתוך {available || 0} שעות זמינות
                        </div>
                      </div>

                      {/* General Hours (for non-class hour types) */}
                      {!hourType.isClassHour && (
                        <div className="border rounded-lg p-3">
                          <div className="flex items-center gap-4">
                            <label className="text-sm font-medium min-w-0">שעות כלליות:</label>
                            <input
                              type="number"
                              min="0"
                              max={Math.min(available || 0, selectedTeacher?.maxHours || 25)}
                              value={allocation.generalHours || 0}
                              onChange={(e) => handleGeneralHoursChange(hourType.id, parseInt(e.target.value) || 0)}
                              className={`w-24 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                error ? 'border-red-500' : ''
                              }`}
                            />
                          </div>
                        </div>
                      )}

                      {/* Class-specific Hours */}
                      {hourType.isClassHour && (
                        <div className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium">הקצאה לכיתות:</label>
                            <select
                              onChange={(e) => {
                                const classId = e.target.value;
                                if (classId && !allocation.classAllocations.hasOwnProperty(classId)) {
                                  // First update session state
                                  const newSessionState = {
                                    ...sessionAddedClasses,
                                    [hourType.id]: new Set([...(sessionAddedClasses[hourType.id] || []), classId])
                                  };
                                  setSessionAddedClasses(newSessionState);
                                  
                                  // Then directly add to allocations with 0 hours
                                  const currentAllocation = allocations[hourType.id] || { generalHours: 0, classAllocations: {} };
                                  const updatedClassAllocations = { ...currentAllocation.classAllocations };
                                  updatedClassAllocations[classId] = 0;
                                  
                                  const updatedAllocation = {
                                    ...currentAllocation,
                                    classAllocations: updatedClassAllocations
                                  };
                                  
                                  setAllocations({ ...allocations, [hourType.id]: updatedAllocation });
                                }
                                e.target.value = '';
                              }}
                              className="text-sm border rounded px-2 py-1 bg-blue-600 text-white hover:bg-blue-700"
                              value=""
                            >
                              <option value="">+ הוסף כיתה</option>
                              {scenario.classes
                                .filter(cls => !allocation.classAllocations.hasOwnProperty(cls.id) && !(sessionAddedClasses[hourType.id]?.has(cls.id)))
                                .map(cls => (
                                  <option key={cls.id} value={cls.id}>
                                    {cls.name} (שכבה {cls.grade})
                                  </option>
                                ))
                              }
                            </select>
                          </div>
                          
                          {/* Show allocated classes and session-added classes */}
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {Object.entries(allocation.classAllocations)
                              .map(([classId, classHours]) => {
                                const cls = scenario.classes.find(c => c.id === classId);
                                if (!cls) return null;
                                
                                const classError = errors[`${hourType.id}-${classId}`];
                                
                                return (
                                  <div key={classId} className="flex items-center gap-3 p-2 border rounded bg-blue-50">
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{cls.name}</div>
                                      <div className="text-xs text-gray-500">שכבה {cls.grade} • {cls.studentCount} תלמידים</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <label className="text-xs text-gray-600">שעות:</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max={Math.min(available || 0, 40)}
                                        value={classHours}
                                        onChange={(e) => handleClassHoursChange(hourType.id, classId, parseInt(e.target.value) || 0)}
                                        className={`w-16 p-1 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                          classError ? 'border-red-500' : ''
                                        }`}
                                        placeholder="0"
                                      />
                                      <button
                                        onClick={() => {
                                          // Remove from session state and directly remove from allocations
                                          setSessionAddedClasses(prev => {
                                            const newState = { ...prev };
                                            if (newState[hourType.id]) {
                                              newState[hourType.id] = new Set(newState[hourType.id]);
                                              newState[hourType.id].delete(classId);
                                              if (newState[hourType.id].size === 0) {
                                                delete newState[hourType.id];
                                              }
                                            }
                                            return newState;
                                          });
                                          
                                          // Directly remove from allocations
                                          const currentAllocation = allocations[hourType.id] || { generalHours: 0, classAllocations: {} };
                                          const updatedClassAllocations = { ...currentAllocation.classAllocations };
                                          delete updatedClassAllocations[classId];
                                          
                                          const updatedAllocation = {
                                            ...currentAllocation,
                                            classAllocations: updatedClassAllocations
                                          };
                                          
                                          setAllocations({ ...allocations, [hourType.id]: updatedAllocation });
                                          
                                          // Clear any errors for this class
                                          const updatedErrors = { ...errors };
                                          delete updatedErrors[`${hourType.id}-${classId}`];
                                          setErrors(updatedErrors);
                                        }}
                                        className="text-red-600 hover:text-red-800 text-sm px-1"
                                        title="הסר כיתה"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                    {classError && (
                                      <div className="text-red-600 text-xs mt-1">{classError}</div>
                                    )}
                                  </div>
                                );
                              })
                            }
                          </div>
                          
                          {Object.keys(allocation.classAllocations).length === 0 && (
                            <div className="text-center py-4 text-gray-500 text-sm">
                              לא נבחרו כיתות עדיין. השתמש בכפתור "הוסף כיתה" למעלה
                            </div>
                          )}
                          
                          {/* General allocation option for class hour types */}
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-4">
                              <label className="text-sm font-medium">שעות כלליות (ללא כיתה ספציפית):</label>
                              <input
                                type="number"
                                min="0"
                                max={Math.min(available || 0, selectedTeacher?.maxHours || 25)}
                                value={allocation.generalHours || 0}
                                onChange={(e) => handleGeneralHoursChange(hourType.id, parseInt(e.target.value) || 0)}
                                className={`w-20 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                  error ? 'border-red-500' : ''
                                }`}
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {error && (
                      <p className="text-red-600 text-sm mt-2">{error}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={saveAllocations}
                disabled={Object.values(errors).some(error => error)}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg"
              >
                שמור הקצאות
              </button>
              <button
                onClick={() => {
                  setShowAllocationForm(false);
                  if (!preSelectedTeacher) {
                    setSelectedTeacher(null);
                  }
                  setErrors({});
                  setSessionAddedHourTypes(new Set());
                  setSessionAddedClasses({});
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
              >
                {preSelectedTeacher ? 'סגור' : 'ביטול'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}