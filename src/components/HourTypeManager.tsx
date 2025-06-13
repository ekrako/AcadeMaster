'use client';

import { useState, useEffect } from 'react';
import { HourType, CreateHourTypeForm } from '@/types';
import { getHourTypes, createHourType, updateHourType, deleteHourType } from '@/lib/database';

export default function HourTypeManager() {
  const [hourTypes, setHourTypes] = useState<HourType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<HourType | null>(null);
  const [formData, setFormData] = useState<CreateHourTypeForm>({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6'
  ];

  useEffect(() => {
    loadHourTypes();
  }, []);

  const loadHourTypes = async () => {
    try {
      const types = await getHourTypes();
      setHourTypes(types);
    } catch (error) {
      console.error('Error loading hour types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingType) {
        await updateHourType(editingType.id, formData);
      } else {
        await createHourType(formData);
      }
      await loadHourTypes();
      resetForm();
    } catch (error) {
      console.error('Error saving hour type:', error);
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
        await deleteHourType(id);
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">ניהול סוגי שעות</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          הוסף סוג שעות חדש
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border">
          <h3 className="text-lg font-semibold mb-4">
            {editingType ? 'עריכת סוג שעות' : 'הוספת סוג שעות חדש'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">שם סוג השעות</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="לדוגמה: שעות הוראה, שעות תיאום"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">תיאור (אופציונלי)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="תיאור קצר של סוג השעות"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">צבע</label>
              <div className="flex gap-2 mb-2">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-gray-800' : 'border-gray-300'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 border rounded-lg"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                {editingType ? 'עדכן' : 'הוסף'}
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
        {hourTypes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            אין סוגי שעות מוגדרים. הוסף סוג שעות ראשון כדי להתחיל.
          </div>
        ) : (
          hourTypes.map(hourType => (
            <div key={hourType.id} className="bg-white p-4 rounded-lg shadow-md border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: hourType.color }}
                />
                <div>
                  <h3 className="font-semibold text-lg">{hourType.name}</h3>
                  {hourType.description && (
                    <p className="text-gray-600 text-sm">{hourType.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(hourType)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                >
                  עריכה
                </button>
                <button
                  onClick={() => handleDelete(hourType.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                >
                  מחיקה
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}