'use client';

import { useState, useEffect } from 'react';
import { HourType, CreateHourTypeForm } from '@/types';
import { getHourTypes, createHourType, updateHourType, deleteHourType } from '@/lib/database';
import { defaultHourTypes } from '@/lib/defaultData';
import { useAuth } from '@/contexts/AuthContext';

export default function HourTypeManager() {
  const { user } = useAuth();
  const [hourTypes, setHourTypes] = useState<HourType[]>([]);
  const [filteredHourTypes, setFilteredHourTypes] = useState<HourType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<HourType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CreateHourTypeForm>({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6',
    '#F97316', '#06B6D4', '#84CC16', '#A855F7'
  ];

  useEffect(() => {
    if (user) {
      loadHourTypes();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterHourTypes();
  }, [hourTypes, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadHourTypes = async () => {
    if (!user) return;
    
    try {
      const types = await getHourTypes(user.uid);
      setHourTypes(types);
    } catch (error) {
      console.error('Error loading hour types:', error);
      if (error instanceof Error && error.message.includes('client side')) {
        setErrors({ general: 'הטעינה תתבצע בקרוב...' });
        // Retry after component mounts on client
        setTimeout(() => {
          loadHourTypes();
        }, 1000);
      } else {
        setErrors({ general: 'שגיאה בטעינת סוגי השעות. אנא נסה שוב.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const filterHourTypes = () => {
    if (!searchTerm.trim()) {
      setFilteredHourTypes(hourTypes);
    } else {
      const filtered = hourTypes.filter(hourType =>
        hourType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (hourType.description && hourType.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredHourTypes(filtered);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'שם סוג השעות הוא שדה חובה';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'שם סוג השעות חייב להכיל לפחות 2 תווים';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'שם סוג השעות לא יכול להכיל יותר מ-50 תווים';
    }

    // Check for duplicate names (excluding current edited type)
    const isDuplicate = hourTypes.some(hourType => 
      hourType.name.toLowerCase() === formData.name.trim().toLowerCase() &&
      hourType.id !== editingType?.id
    );
    if (isDuplicate) {
      newErrors.name = 'סוג שעות עם שם זה כבר קיים';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'התיאור לא יכול להכיל יותר מ-200 תווים';
    }

    if (!formData.color || !/^#[0-9A-F]{6}$/i.test(formData.color)) {
      newErrors.color = 'יש לבחור צבע תקין';
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
      const trimmedData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || ''
      };

      if (editingType) {
        await updateHourType(user!.uid, editingType.id, trimmedData);
      } else {
        await createHourType(user!.uid, trimmedData);
      }
      await loadHourTypes();
      resetForm();
    } catch (error) {
      console.error('Error saving hour type:', error);
      setErrors({ general: 'שגיאה בשמירת סוג השעות. אנא נסה שוב.' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (hourType: HourType) => {
    setEditingType(hourType);
    setFormData({
      name: hourType.name,
      description: hourType.description || '',
      color: hourType.color
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק סוג שעות זה?')) {
      try {
        await deleteHourType(user!.uid, id);
        await loadHourTypes();
      } catch (error) {
        console.error('Error deleting hour type:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#3B82F6' });
    setEditingType(null);
    setShowForm(false);
    setErrors({});
  };

  const initializeDefaultHourTypes = async () => {
    setSaving(true);
    setErrors({});

    try {
      for (const hourType of defaultHourTypes) {
        await createHourType(user!.uid, hourType);
      }
      await loadHourTypes();
    } catch (error) {
      console.error('Error initializing default hour types:', error);
      setErrors({ general: 'שגיאה ביצירת סוגי השעות המוגדרים מראש. אנא נסה שוב.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">טוען סוגי שעות...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">ניהול סוגי שעות</h2>
          <p className="text-gray-600 text-sm mt-1">
            הגדר סוגי שעות שישמשו בכל התרחישים
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg whitespace-nowrap"
        >
          הוסף סוג שעות חדש
        </button>
      </div>

      {/* Search Bar */}
      {hourTypes.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חפש סוגי שעות..."
              className="w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute right-3 top-3 text-gray-400">
              🔍
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{errors.general}</p>
          <button
            onClick={() => {
              setErrors({});
              loadHourTypes();
            }}
            className="mt-2 text-red-600 underline hover:text-red-800"
          >
            נסה שוב
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border">
          <h3 className="text-lg font-semibold mb-4">
            {editingType ? 'עריכת סוג שעות' : 'הוספת סוג שעות חדש'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">שם סוג השעות *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500 bg-red-50' : ''
                }`}
                placeholder="לדוגמה: שעות הוראה, שעות תיאום"
                required
                maxLength={50}
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {formData.name.length}/50 תווים
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
                placeholder="תיאור קצר של סוג השעות"
                rows={3}
                maxLength={200}
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                {formData.description?.length || 0}/200 תווים
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">צבע *</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${
                      formData.color === color ? 'border-gray-800 shadow-lg' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 border rounded-lg cursor-pointer"
                />
                <span className="text-sm text-gray-600 font-mono">{formData.color}</span>
              </div>
              {errors.color && (
                <p className="text-red-600 text-sm mt-1">{errors.color}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg flex items-center gap-2"
              >
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                {saving ? 'שומר...' : (editingType ? 'עדכן' : 'הוסף')}
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

      <div className="grid gap-4">
        {/* Statistics */}
        {hourTypes.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-800">
                סה״כ סוגי שעות: <strong>{hourTypes.length}</strong>
              </span>
              {searchTerm && (
                <span className="text-blue-600">
                  מציג: <strong>{filteredHourTypes.length}</strong> מתוך {hourTypes.length}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Empty States */}
        {hourTypes.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-gray-400 text-4xl mb-4">⏰</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין סוגי שעות מוגדרים</h3>
            <p className="text-gray-500 mb-4">התחל עם סוגי שעות מוגדרים מראש או הוסף סוג שעות משלך</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={initializeDefaultHourTypes}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 justify-center"
              >
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                ⚡ יצירת סוגי שעות מוגדרים מראש
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                ➕ הוסף סוג שעות חדש
              </button>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">סוגי השעות המוגדרים מראש כוללים:</h4>
              <div className="text-sm text-blue-700 grid grid-cols-2 gap-1">
                {defaultHourTypes.map((type, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }}></div>
                    <span>{type.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : filteredHourTypes.length === 0 ? (
          <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-yellow-500 text-3xl mb-3">🔍</div>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">לא נמצאו תוצאות</h3>
            <p className="text-yellow-600 mb-4">לא נמצאו סוגי שעות התואמים לחיפוש "{searchTerm}"</p>
            <button
              onClick={() => setSearchTerm('')}
              className="text-yellow-700 underline hover:text-yellow-900"
            >
              נקה חיפוש
            </button>
          </div>
        ) : (
          filteredHourTypes.map(hourType => (
            <div key={hourType.id} className="bg-white p-4 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-200 shadow-sm"
                    style={{ backgroundColor: hourType.color }}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{hourType.name}</h3>
                    {hourType.description && (
                      <p className="text-gray-600 text-sm mt-1">{hourType.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>נוצר: {hourType.createdAt.toLocaleDateString('he-IL')}</span>
                      {hourType.updatedAt > hourType.createdAt && (
                        <span>עודכן: {hourType.updatedAt.toLocaleDateString('he-IL')}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(hourType)}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                    title="ערוך סוג שעות"
                  >
                    ✏️ עריכה
                  </button>
                  <button
                    onClick={() => handleDelete(hourType.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                    title="מחק סוג שעות"
                  >
                    🗑️ מחיקה
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}