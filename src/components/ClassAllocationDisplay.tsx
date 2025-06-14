'use client';

import { Scenario } from '@/types';
import { useHourTypes } from '@/contexts/HourTypesContext';

interface ClassAllocationDisplayProps {
  scenario: Scenario;
}

export default function ClassAllocationDisplay({ scenario }: ClassAllocationDisplayProps) {
  const { hourTypes } = useHourTypes();

  const getHourTypeColor = (hourTypeId: string): string => {
    const hourType = hourTypes.find(ht => ht.id === hourTypeId);
    return hourType?.color || '#6B7280';
  };

  const getHourTypeName = (hourTypeId: string): string => {
    const hourType = hourTypes.find(ht => ht.id === hourTypeId);
    return hourType?.name || 'לא ידוע';
  };

  const getTeacherName = (teacherId: string): string => {
    const teacher = scenario.teachers.find(t => t.id === teacherId);
    return teacher?.name || 'לא ידוע';
  };

  const getOtherClassNames = (allocation: any, currentClassId: string): string => {
    const classIds = allocation.classIds || (allocation.classId ? [allocation.classId] : []);
    const otherClassIds = classIds.filter((id: string) => id !== currentClassId);
    
    if (otherClassIds.length === 0) {
      return '';
    }
    
    const otherClassNames = otherClassIds
      .map((classId: string) => {
        const cls = scenario.classes.find(c => c.id === classId);
        return cls ? cls.name : '';
      })
      .filter((name: string) => name);
    
    return otherClassNames.join(', ');
  };

  // Group allocations by class
  const allocationsByClass = scenario.classes.map(cls => {
    const classAllocations = scenario.allocations.filter(a => {
      // Check both old classId and new classIds format
      return (a.classIds && a.classIds.includes(cls.id)) || a.classId === cls.id;
    });
    return {
      class: cls,
      allocations: classAllocations
    };
  }).filter(item => item.allocations.length > 0);

  // Get allocations without class assignment (non-class hours)
  const generalAllocations = scenario.allocations.filter(a => {
    const hasClassIds = a.classIds && a.classIds.length > 0;
    const hasClassId = a.classId && a.classId !== '';
    return !hasClassIds && !hasClassId;
  });

  if (scenario.classes.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <div className="text-yellow-600 text-2xl mb-2">🏫</div>
        <h3 className="text-lg font-medium text-yellow-800 mb-2">אין כיתות מוגדרות</h3>
        <p className="text-yellow-700">
          יש להוסיף כיתות תחילה כדי לראות הקצאות לכיתות
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Class Allocations */}
      {allocationsByClass.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-4">הקצאות לכיתות</h4>
          <div className="grid gap-4">
            {allocationsByClass.map(({ class: cls, allocations }) => (
              <div key={cls.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h5 className="font-semibold text-lg">{cls.name}</h5>
                    <span className="text-sm text-gray-500">שכבה {cls.grade}</span>
                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                      {cls.studentCount} תלמידים
                    </span>
                    {cls.isSpecialEducation && (
                      <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                        חינוך מיוחד
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    סה״כ שעות: <strong>{allocations.reduce((sum, a) => sum + a.hours, 0)}</strong>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {allocations.map(allocation => {
                    const otherClasses = getOtherClassNames(allocation, cls.id);
                    return (
                      <div 
                        key={allocation.id} 
                        className="flex items-center justify-between p-3 rounded-lg border-l-4"
                        style={{ borderLeftColor: getHourTypeColor(allocation.hourTypeId) }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getHourTypeColor(allocation.hourTypeId) }}
                          />
                          <span className="font-medium">{getHourTypeName(allocation.hourTypeId)}</span>
                          <span className="text-sm text-gray-600">
                            {allocation.hours} שעות
                          </span>
                          {otherClasses && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              גם עם: {otherClasses}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          מורה: <strong>{getTeacherName(allocation.teacherId)}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Allocations (Non-class hours) */}
      {generalAllocations.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-4">הקצאות כלליות (שעות ללא כיתה)</h4>
          <div className="bg-white border rounded-lg p-4">
            <div className="space-y-2">
              {generalAllocations.map(allocation => (
                <div 
                  key={allocation.id} 
                  className="flex items-center justify-between p-3 rounded-lg border-l-4"
                  style={{ borderLeftColor: getHourTypeColor(allocation.hourTypeId) }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getHourTypeColor(allocation.hourTypeId) }}
                    />
                    <span className="font-medium">{getHourTypeName(allocation.hourTypeId)}</span>
                    <span className="text-sm text-gray-600">
                      {allocation.hours} שעות
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    מורה: <strong>{getTeacherName(allocation.teacherId)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {allocationsByClass.length === 0 && generalAllocations.length === 0 && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="text-gray-400 text-3xl mb-3">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">אין הקצאות עדיין</h3>
          <p className="text-gray-500">
            השתמש בכרטיסיית "הקצאות" כדי להקצות שעות למורים
          </p>
        </div>
      )}
    </div>
  );
}