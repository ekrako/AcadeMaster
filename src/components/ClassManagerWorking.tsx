'use client';

import { useState, useEffect, useRef } from 'react';
import { Class } from '@/types';

interface ClassManagerWorkingProps {
  scenarioId: string;
  classes: Class[];
  onUpdate: (classes: Class[]) => void;
}

export default function ClassManagerWorking({ scenarioId, classes, onUpdate }: ClassManagerWorkingProps) {
  const [localClasses, setLocalClasses] = useState<Class[]>(classes);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    studentCount: 25,
    homeroomTeacherId: '',
    isSpecialEducation: false
  });
  
  const formRef = useRef<HTMLDivElement>(null);

  const grades = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];

  useEffect(() => {
    setLocalClasses(classes);
  }, [classes]);

  useEffect(() => {
    filterClasses();
  }, [localClasses, searchTerm]);

  const filterClasses = () => {
    if (!searchTerm.trim()) {
      setFilteredClasses(localClasses);
    } else {
      const filtered = localClasses.filter(cls =>
        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.grade.includes(searchTerm)
      );
      setFilteredClasses(filtered);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'שם הכיתה הוא שדה חובה';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'שם הכיתה חייב להכיל לפחות 2 תווים';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'שם הכיתה לא יכול להכיל יותר מ-50 תווים';
    }

    if (!formData.grade) {
      newErrors.grade = 'שכבה היא שדה חובה';
    }

    const isDuplicate = localClasses.some(cls => 
      cls.name.toLowerCase() === formData.name.trim().toLowerCase() &&
      cls.id !== editingClass?.id
    );
    if (isDuplicate) {
      newErrors.name = 'כיתה עם שם זה כבר קיימת';
    }

    if (formData.studentCount < 1 || formData.studentCount > 50) {
      newErrors.studentCount = 'מספר תלמידים חייב להיות בין 1 ל-50';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const classData = {
      name: formData.name.trim(),
      grade: formData.grade,
      studentCount: formData.studentCount,
      homeroomTeacherId: formData.homeroomTeacherId || undefined,
      isSpecialEducation: formData.isSpecialEducation
    };

    let updatedClasses: Class[];
    
    if (editingClass) {
      updatedClasses = localClasses.map(cls =>
        cls.id === editingClass.id
          ? { ...cls, ...classData }
          : cls
      );
    } else {
      const newClass: Class = {
        id: Date.now().toString(),
        ...classData
      };
      updatedClasses = [...localClasses, newClass];
    }
    
    setLocalClasses(updatedClasses);
    onUpdate(updatedClasses);
    resetForm();
  };

  const handleEdit = (cls: Class) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      grade: cls.grade,
      studentCount: cls.studentCount,
      homeroomTeacherId: cls.homeroomTeacherId || '',
      isSpecialEducation: cls.isSpecialEducation || false
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
    if (confirm('האם אתה בטוח שברצונך למחוק כיתה זו?')) {
      const updatedClasses = localClasses.filter(c => c.id !== id);
      setLocalClasses(updatedClasses);
      onUpdate(updatedClasses);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      grade: '',
      studentCount: 25,
      homeroomTeacherId: '',
      isSpecialEducation: false
    });
    setEditingClass(null);
    setShowForm(false);
    setErrors({});
  };

  // Group classes by grade
  const classesByGrade = filteredClasses.reduce((acc, cls) => {
    if (!acc[cls.grade]) {
      acc[cls.grade] = [];
    }
    acc[cls.grade].push(cls);
    return acc;
  }, {} as Record<string, Class[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold">ניהול כיתות</h3>
          <p className="text-gray-600 text-sm mt-1">
            הוסף ונהל כיתות בתרחיש זה
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg whitespace-nowrap"
        >
          הוסף כיתה חדשה
        </button>
      </div>

      {/* Search Bar */}
      {localClasses.length > 0 && (
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חפש כיתות..."
            className="w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
            {editingClass ? 'עריכת כיתה' : 'הוספת כיתה חדשה'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">שם הכיתה *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.name ? 'border-red-500 bg-red-50' : ''
                  }`}
                  placeholder="לדוגמה: א1, ב2"
                  required
                  maxLength={50}
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">שכבה *</label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.grade ? 'border-red-500 bg-red-50' : ''
                  }`}
                  required
                >
                  <option value="">בחר שכבה</option>
                  {grades.map(grade => (
                    <option key={grade} value={grade}>
                      כיתה {grade}׳
                    </option>
                  ))}
                </select>
                {errors.grade && (
                  <p className="text-red-600 text-sm mt-1">{errors.grade}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">מספר תלמידים *</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.studentCount}
                  onChange={(e) => setFormData({ ...formData, studentCount: parseInt(e.target.value) || 25 })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.studentCount ? 'border-red-500 bg-red-50' : ''
                  }`}
                  required
                />
                {errors.studentCount && (
                  <p className="text-red-600 text-sm mt-1">{errors.studentCount}</p>
                )}
              </div>
            </div>

            <div className="col-span-full">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isSpecialEducation}
                  onChange={(e) => setFormData({ ...formData, isSpecialEducation: e.target.checked })}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium">כיתת חינוך מיוחד</span>
              </label>
              <p className="text-gray-500 text-xs mt-1">
                סמן אם זו כיתת חינוך מיוחד
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
              >
                {editingClass ? 'עדכן' : 'הוסף'}
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

      <div className="space-y-6">
        {localClasses.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-gray-400 text-4xl mb-4">🏫</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין כיתות מוגדרות</h3>
            <p className="text-gray-500 mb-4">הוסף כיתות לתרחיש זה כדי להתחיל בהקצאת שעות</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
            >
              הוסף כיתה ראשונה
            </button>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-yellow-500 text-3xl mb-3">🔍</div>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">לא נמצאו תוצאות</h3>
            <p className="text-yellow-600 mb-4">לא נמצאו כיתות התואמות לחיפוש "{searchTerm}"</p>
            <button
              onClick={() => setSearchTerm('')}
              className="text-yellow-700 underline hover:text-yellow-900"
            >
              נקה חיפוש
            </button>
          </div>
        ) : (
          Object.entries(classesByGrade)
            .sort(([a], [b]) => grades.indexOf(a) - grades.indexOf(b))
            .map(([grade, gradeClasses]) => (
              <div key={grade} className="space-y-4">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-700">
                    שכבה {grade}׳
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm text-gray-600">
                    <div>
                      <span className="text-gray-500">כיתות:</span>
                      <strong className="text-gray-700 mr-1">{gradeClasses.length}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500">כיתות רגילות:</span>
                      <strong className="text-gray-700 mr-1">
                        {gradeClasses.filter(cls => !cls.isSpecialEducation).length}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500">חינוך מיוחד:</span>
                      <strong className="text-purple-700 mr-1">
                        {gradeClasses.filter(cls => cls.isSpecialEducation).length}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500">סה״כ תלמידים:</span>
                      <strong className="text-gray-700 mr-1">
                        {gradeClasses.reduce((sum, cls) => sum + cls.studentCount, 0)}
                      </strong>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4">
                  {gradeClasses
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(cls => (
                      <div key={cls.id} className="bg-white p-4 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h5 className="font-semibold text-lg">{cls.name}</h5>
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                {cls.studentCount} תלמידים
                              </span>
                              {cls.isSpecialEducation && (
                                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                                  חינוך מיוחד
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mr-4">
                            <button
                              onClick={() => handleEdit(cls)}
                              className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-sm font-medium"
                            >
                              ✏️ עריכה
                            </button>
                            <button
                              onClick={() => handleDelete(cls.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm font-medium"
                            >
                              🗑️ מחיקה
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                }
                </div>
              </div>
            ))
        )}
      </div>

      {filteredClasses.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="text-green-800">סה״כ כיתות:</span>
              <strong className="text-green-900 mr-1">{localClasses.length}</strong>
            </div>
            <div>
              <span className="text-green-800">כיתות רגילות:</span>
              <strong className="text-green-900 mr-1">
                {localClasses.filter(cls => !cls.isSpecialEducation).length}
              </strong>
            </div>
            <div>
              <span className="text-purple-800">כיתות חינוך מיוחד:</span>
              <strong className="text-purple-900 mr-1">
                {localClasses.filter(cls => cls.isSpecialEducation).length}
              </strong>
            </div>
            <div>
              <span className="text-green-800">סה״כ תלמידים:</span>
              <strong className="text-green-900 mr-1">
                {localClasses.reduce((sum, cls) => sum + cls.studentCount, 0)}
              </strong>
            </div>
            {searchTerm && (
              <div>
                <span className="text-green-600">מציג:</span>
                <strong className="text-green-700 mr-1">{filteredClasses.length}</strong>
                מתוך {localClasses.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}