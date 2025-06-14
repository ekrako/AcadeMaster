'use client';

import { useState, useEffect, useRef } from 'react';
import { Teacher, Scenario, Allocation } from '@/types';
import { useHourTypes } from '@/contexts/HourTypesContext';
import AllocationManagerWorking from './AllocationManagerWorking';

interface TeacherManagerWorkingProps {
  scenarioId: string;
  teachers: Teacher[];
  onUpdate: (teachers: Teacher[]) => void;
  scenario?: Scenario;
  onScenarioUpdate?: (scenario: Scenario) => void;
}

export default function TeacherManagerWorking({ scenarioId, teachers, onUpdate, scenario, onScenarioUpdate }: TeacherManagerWorkingProps) {
  const [localTeachers, setLocalTeachers] = useState<Teacher[]>(teachers);
  
  // Generate unique 9-digit ID number
  const generateUniqueIdNumber = (): string => {
    const existingIds = localTeachers.map(t => t.idNumber).filter(Boolean);
    let newId: string;
    do {
      // Generate random 9-digit number (100000000-999999999)
      newId = Math.floor(100000000 + Math.random() * 900000000).toString();
    } while (existingIds.includes(newId));
    return newId;
  };
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showEditAllocationModal, setShowEditAllocationModal] = useState(false);
  const { hourTypes } = useHourTypes();
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    idNumber: '',
    subject: '',
    maxHours: 25,
    homeroomClassIds: [] as string[]
  });
  
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalTeachers(teachers);
  }, [teachers]);

  useEffect(() => {
    filterTeachers();
  }, [localTeachers, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const filterTeachers = () => {
    if (!searchTerm.trim()) {
      setFilteredTeachers(localTeachers);
    } else {
      const filtered = localTeachers.filter(teacher =>
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (teacher.email && teacher.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (teacher.idNumber && teacher.idNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (teacher.subject && teacher.subject.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredTeachers(filtered);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'שם המורה הוא שדה חובה';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'שם המורה חייב להכיל לפחות 2 תווים';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'שם המורה לא יכול להכיל יותר מ-100 תווים';
    }

    if (formData.idNumber.trim()) {
      const isDuplicate = localTeachers.some(teacher => 
        teacher.idNumber === formData.idNumber.trim() &&
        teacher.id !== editingTeacher?.id
      );
      if (isDuplicate) {
        newErrors.idNumber = 'מספר תעודת זהות זה כבר קיים במערכת';
      }
    }

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'כתובת דוא"ל לא תקינה';
      }
    }

    if (formData.phone) {
      const phoneRegex = /^[\d-+().\s]+$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'מספר טלפון לא תקין';
      }
    }

    if (formData.maxHours < 1 || formData.maxHours > 60) {
      newErrors.maxHours = 'מספר שעות מקסימלי חייב להיות בין 1 ל-60';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const teacherData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      idNumber: formData.idNumber.trim() || (editingTeacher ? editingTeacher.idNumber : ''),
      subject: formData.subject.trim(),
      maxHours: formData.maxHours,
      allocatedHours: 0,
      homeroomClassIds: formData.homeroomClassIds
    };

    let updatedTeachers: Teacher[];
    
    if (editingTeacher) {
      updatedTeachers = localTeachers.map(teacher =>
        teacher.id === editingTeacher.id
          ? { ...teacher, ...teacherData }
          : teacher
      );
    } else {
      const newTeacher: Teacher = {
        id: Date.now().toString(),
        ...teacherData,
        idNumber: teacherData.idNumber || generateUniqueIdNumber(),
      };
      updatedTeachers = [...localTeachers, newTeacher];
    }
    
    setLocalTeachers(updatedTeachers);
    onUpdate(updatedTeachers);
    resetForm();
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email || '',
      phone: teacher.phone || '',
      idNumber: teacher.idNumber || '',
      subject: teacher.subject || '',
      maxHours: teacher.maxHours,
      homeroomClassIds: teacher.homeroomClassIds || []
    });
    setShowForm(true);
    
    setTimeout(() => {
      formRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };

  const handleDelete = (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק מורה זה?')) {
      const updatedTeachers = localTeachers.filter(t => t.id !== id);
      setLocalTeachers(updatedTeachers);
      onUpdate(updatedTeachers);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      idNumber: '',
      subject: '',
      maxHours: 25,
      homeroomClassIds: []
    });
    setEditingTeacher(null);
    setShowForm(false);
    setErrors({});
  };

  const getTeacherAllocations = (teacherId: string): Allocation[] => {
    if (!scenario) return [];
    return scenario.allocations.filter(a => a.teacherId === teacherId);
  };

  const getHomeroomClasses = (teacherId: string): string[] => {
    if (!scenario) return [];
    return scenario.classes
      .filter(c => c.homeroomTeacherId === teacherId)
      .map(c => c.name);
  };

  const getHourTypeName = (hourTypeId: string): string => {
    const hourType = hourTypes.find(ht => ht.id === hourTypeId);
    return hourType?.name || 'לא ידוע';
  };

  const getHourTypeColor = (hourTypeId: string): string => {
    const hourType = hourTypes.find(ht => ht.id === hourTypeId);
    return hourType?.color || '#6B7280';
  };

  const getClassName = (classId: string): string => {
    if (!scenario) return 'לא ידוע';
    const cls = scenario.classes.find(c => c.id === classId);
    return cls?.name || 'לא ידוע';
  };

  const handleViewAllocations = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowAllocationModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold">ניהול מורים</h3>
          <p className="text-gray-600 text-sm mt-1">
            הוסף ונהל מורים בתרחיש זה
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg whitespace-nowrap"
        >
          הוסף מורה חדש
        </button>
      </div>

      {/* Search Bar */}
      {localTeachers.length > 0 && (
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חפש מורים..."
            className="w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute right-3 top-3 text-gray-400">
            🔍
          </div>
        </div>
      )}

      {/* Error Message */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{errors.general}</p>
        </div>
      )}

      {showForm && (
        <div ref={formRef} className="bg-white p-6 rounded-lg shadow-md border">
          <h4 className="text-lg font-semibold mb-4">
            {editingTeacher ? 'עריכת מורה' : 'הוספת מורה חדש'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">שם מלא *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500 bg-red-50' : ''
                  }`}
                  placeholder="לדוגמה: ישראל ישראלי"
                  required
                  maxLength={100}
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">מספר תעודת זהות</label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.idNumber ? 'border-red-500 bg-red-50' : ''
                  }`}
                  placeholder="לדוגמה: 123456789 (יונפק אוטומטית אם ריק)"
                />
                {errors.idNumber && (
                  <p className="text-red-600 text-sm mt-1">{errors.idNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">דוא"ל</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-500 bg-red-50' : ''
                  }`}
                  placeholder="israel@example.com"
                  dir="ltr"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">טלפון</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.phone ? 'border-red-500 bg-red-50' : ''
                  }`}
                  placeholder="050-1234567"
                  dir="ltr"
                />
                {errors.phone && (
                  <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">מקצוע</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="לדוגמה: מתמטיקה, אנגלית"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">שעות מקסימום *</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.maxHours}
                  onChange={(e) => setFormData({ ...formData, maxHours: parseInt(e.target.value) || 25 })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.maxHours ? 'border-red-500 bg-red-50' : ''
                  }`}
                  required
                />
                {errors.maxHours && (
                  <p className="text-red-600 text-sm mt-1">{errors.maxHours}</p>
                )}
              </div>
            </div>

            {/* Homeroom Classes Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">כיתות חינוך (עד 2)</label>
              <div className="space-y-2">
                {scenario?.classes && scenario.classes.length > 0 ? (
                  scenario.classes.map(classItem => (
                    <label key={classItem.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.homeroomClassIds.includes(classItem.id)}
                        onChange={(e) => {
                          const currentIds = formData.homeroomClassIds;
                          if (e.target.checked) {
                            // Add class if limit not reached
                            if (currentIds.length < 2) {
                              setFormData({ 
                                ...formData, 
                                homeroomClassIds: [...currentIds, classItem.id] 
                              });
                            }
                          } else {
                            // Remove class
                            setFormData({ 
                              ...formData, 
                              homeroomClassIds: currentIds.filter(id => id !== classItem.id) 
                            });
                          }
                        }}
                        disabled={!formData.homeroomClassIds.includes(classItem.id) && formData.homeroomClassIds.length >= 2}
                        className="mr-2"
                      />
                      <span className={`${
                        !formData.homeroomClassIds.includes(classItem.id) && formData.homeroomClassIds.length >= 2 
                          ? 'text-gray-400' : 'text-gray-700'
                      }`}>
                        {classItem.name} ({classItem.grade})
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">אין כיתות זמינות בתרחיש זה</p>
                )}
              </div>
              {formData.homeroomClassIds.length >= 2 && (
                <p className="text-blue-600 text-sm mt-1">נבחרו המקסימום כיתות (2)</p>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                {editingTeacher ? 'עדכן' : 'הוסף'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {localTeachers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-gray-400 text-4xl mb-4">👨‍🏫</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין מורים מוגדרים</h3>
            <p className="text-gray-500 mb-4">הוסף מורים לתרחיש זה כדי להתחיל בהקצאת שעות</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              הוסף מורה ראשון
            </button>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-yellow-500 text-3xl mb-3">🔍</div>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">לא נמצאו תוצאות</h3>
            <p className="text-yellow-600 mb-4">לא נמצאו מורים התואמים לחיפוש "{searchTerm}"</p>
            <button
              onClick={() => setSearchTerm('')}
              className="text-yellow-700 underline hover:text-yellow-900"
            >
              נקה חיפוש
            </button>
          </div>
        ) : (
          filteredTeachers.map(teacher => (
            <div key={teacher.id} className="bg-white p-4 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{teacher.name}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm text-gray-600">
                    {teacher.idNumber && (
                      <div>
                        <span className="text-gray-500">מספר תעודת זהות:</span> {teacher.idNumber}
                      </div>
                    )}
                    {teacher.subject && (
                      <div>
                        <span className="text-gray-500">מקצוע:</span> {teacher.subject}
                      </div>
                    )}
                    {teacher.email && (
                      <div>
                        <span className="text-gray-500">דוא"ל:</span> <span dir="ltr">{teacher.email}</span>
                      </div>
                    )}
                    {teacher.phone && (
                      <div>
                        <span className="text-gray-500">טלפון:</span> <span dir="ltr">{teacher.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Display Homeroom Classes */}
                  {teacher.homeroomClassIds && teacher.homeroomClassIds.length > 0 && (
                    <div className="mt-2">
                      <span className="text-gray-500 text-sm">מחנך של: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {teacher.homeroomClassIds.map(classId => {
                          const classItem = scenario?.classes?.find(c => c.id === classId);
                          return classItem ? (
                            <span 
                              key={classId}
                              className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {classItem.name} ({classItem.grade})
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">שעות:</span>
                      <span className={`font-medium ${
                        teacher.allocatedHours > teacher.maxHours ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {teacher.allocatedHours}/{teacher.maxHours}
                      </span>
                      <div className="flex-1 max-w-xs">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              teacher.allocatedHours > teacher.maxHours ? 'bg-red-600' : 'bg-green-600'
                            }`}
                            style={{ width: `${Math.min((teacher.allocatedHours / teacher.maxHours) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {scenario && (
                      <>
                        {/* Show homeroom classes */}
                        {getHomeroomClasses(teacher.id).length > 0 ? (
                          <div className="text-sm">
                            <span className="text-gray-500">מחנך של:</span>
                            <span className="mr-2 font-medium text-blue-600">
                              {getHomeroomClasses(teacher.id).join(', ')}
                            </span>
                            {getHomeroomClasses(teacher.id).length >= 2 && (
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                מקסימום כיתות
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm">
                            <span className="text-gray-500">מחנך של:</span>
                            <span className="mr-2 text-gray-400">אין כיתות</span>
                          </div>
                        )}
                        
                        {/* Show allocation summary */}
                        {getTeacherAllocations(teacher.id).length > 0 && (
                          <div className="text-sm">
                            <span className="text-gray-500">הקצאות:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {getTeacherAllocations(teacher.id).map(allocation => {
                                const classNames = allocation.classIds && allocation.classIds.length > 0
                                  ? allocation.classIds.map(id => getClassName(id)).join(', ')
                                  : allocation.classId ? getClassName(allocation.classId) : 'כללי';
                                return (
                                  <span
                                    key={allocation.id}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
                                    style={{ 
                                      backgroundColor: `${getHourTypeColor(allocation.hourTypeId)}20`,
                                      color: getHourTypeColor(allocation.hourTypeId)
                                    }}
                                  >
                                    {getHourTypeName(allocation.hourTypeId)}: {allocation.hours}
                                    <span className="text-xs opacity-75">({classNames})</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 mr-4">
                  {scenario && (
                    <button
                      onClick={() => handleViewAllocations(teacher)}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded text-sm font-medium"
                    >
                      📊 הקצאות
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(teacher)}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-sm font-medium"
                  >
                    ✏️ עריכה
                  </button>
                  <button
                    onClick={() => handleDelete(teacher.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm font-medium"
                  >
                    🗑️ מחיקה
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {filteredTeachers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-800">
              סה״כ מורים: <strong>{localTeachers.length}</strong>
            </span>
            {searchTerm && (
              <span className="text-blue-600">
                מציג: <strong>{filteredTeachers.length}</strong> מתוך {localTeachers.length}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Teacher Allocation Modal */}
      {showAllocationModal && selectedTeacher && scenario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                הקצאות של {selectedTeacher.name}
              </h3>
              <button
                onClick={() => setShowAllocationModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Teacher Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-800">שעות מוקצות:</span>
                    <strong className="text-blue-900 mr-1">
                      {selectedTeacher.allocatedHours}/{selectedTeacher.maxHours}
                    </strong>
                  </div>
                  <div>
                    <span className="text-blue-800">ניצולת:</span>
                    <strong className="text-blue-900 mr-1">
                      {Math.round((selectedTeacher.allocatedHours / selectedTeacher.maxHours) * 100)}%
                    </strong>
                  </div>
                  <div>
                    <span className="text-blue-800">מקצוע:</span>
                    <strong className="text-blue-900 mr-1">
                      {selectedTeacher.subject || 'לא צוין'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-blue-800">מחנך של:</span>
                    <strong className="text-blue-900 mr-1">
                      {getHomeroomClasses(selectedTeacher.id).length > 0 
                        ? `${getHomeroomClasses(selectedTeacher.id).join(', ')} (${getHomeroomClasses(selectedTeacher.id).length}/2)`
                        : 'אין (0/2)'}
                    </strong>
                    {getHomeroomClasses(selectedTeacher.id).length >= 2 && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded mr-1">
                        מקסימום
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Allocations List */}
              <div className="space-y-3">
                <h4 className="font-medium">פירוט הקצאות:</h4>
                {getTeacherAllocations(selectedTeacher.id).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    אין הקצאות למורה זה
                  </div>
                ) : (
                  getTeacherAllocations(selectedTeacher.id).map(allocation => {
                    const classNames = allocation.classIds && allocation.classIds.length > 0
                      ? allocation.classIds.map(id => getClassName(id)).join(', ')
                      : allocation.classId ? getClassName(allocation.classId) : 'כללי';
                    
                    return (
                      <div 
                        key={allocation.id}
                        className="flex items-center justify-between p-3 border rounded-lg border-l-4"
                        style={{ borderLeftColor: getHourTypeColor(allocation.hourTypeId) }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: getHourTypeColor(allocation.hourTypeId) }}
                          />
                          <div>
                            <div className="font-medium">{getHourTypeName(allocation.hourTypeId)}</div>
                            <div className="text-sm text-gray-600">{classNames}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{allocation.hours} שעות</div>
                          {allocation.notes && (
                            <div className="text-xs text-gray-500">{allocation.notes}</div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                {onScenarioUpdate && (
                  <button
                    onClick={() => {
                      setShowAllocationModal(false);
                      setShowEditAllocationModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    ערוך הקצאות
                  </button>
                )}
                <button
                  onClick={() => setShowAllocationModal(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  סגור
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Allocation Modal */}
      {showEditAllocationModal && selectedTeacher && scenario && onScenarioUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">
                  עריכת הקצאות ל{selectedTeacher.name}
                </h3>
                <button
                  onClick={() => setShowEditAllocationModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <AllocationManagerWorking
                scenario={scenario}
                onUpdate={(updatedScenario) => {
                  onScenarioUpdate(updatedScenario);
                  setShowEditAllocationModal(false);
                }}
                preSelectedTeacher={selectedTeacher}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}