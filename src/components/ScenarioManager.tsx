'use client';

import { useState, useEffect } from 'react';
import { Scenario, HourType, CreateScenarioForm, HourBank } from '@/types';
import { getScenarios, getHourTypes, createScenario, deleteScenario } from '@/lib/database';

export default function ScenarioManager() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [hourTypes, setHourTypes] = useState<HourType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateScenarioForm>({
    name: '',
    description: '',
  });
  const [hourBankData, setHourBankData] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [scenariosData, hourTypesData] = await Promise.all([
        getScenarios(),
        getHourTypes()
      ]);
      setScenarios(scenariosData);
      setHourTypes(hourTypesData);
      
      // Initialize hour bank data with zeros
      const initialHourBanks: Record<string, number> = {};
      hourTypesData.forEach(hourType => {
        initialHourBanks[hourType.id] = 0;
      });
      setHourBankData(initialHourBanks);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create hour banks from form data
      const hourBanks: HourBank[] = hourTypes.map(hourType => ({
        id: `${Date.now()}-${hourType.id}`,
        hourTypeId: hourType.id,
        totalHours: hourBankData[hourType.id] || 0,
        allocatedHours: 0,
        remainingHours: hourBankData[hourType.id] || 0
      }));

      const newScenario: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        description: formData.description,
        isActive: false,
        hourBanks,
        teachers: [],
        classes: [],
        allocations: []
      };

      await createScenario(newScenario);
      await loadData();
      resetForm();
    } catch (error) {
      console.error('Error creating scenario:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק תרחיש זה?')) {
      try {
        await deleteScenario(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting scenario:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    const initialHourBanks: Record<string, number> = {};
    hourTypes.forEach(hourType => {
      initialHourBanks[hourType.id] = 0;
    });
    setHourBankData(initialHourBanks);
    setShowForm(false);
  };

  const handleHourBankChange = (hourTypeId: string, hours: number) => {
    setHourBankData(prev => ({
      ...prev,
      [hourTypeId]: Math.max(0, hours)
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">טוען תרחישים...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">ניהול תרחישים</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          disabled={hourTypes.length === 0}
        >
          צור תרחיש חדש
        </button>
      </div>

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
          <h3 className="text-lg font-semibold mb-4">יצירת תרחיש חדש</h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">שם התרחיש</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="לדוגמה: תרחיש שנה א׳ תשפ״ה"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">תיאור (אופציונלי)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="תיאור קצר של התרחיש"
                />
              </div>
            </div>

            <div>
              <h4 className="text-md font-semibold mb-3">הגדרת בנק שעות לתרחיש</h4>
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
                    <input
                      type="number"
                      min="0"
                      value={hourBankData[hourType.id] || 0}
                      onChange={(e) => handleHourBankChange(hourType.id, parseInt(e.target.value) || 0)}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="מספר שעות"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
              >
                צור תרחיש
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

      <div className="grid gap-6">
        {scenarios.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            אין תרחישים מוגדרים. צור תרחיש ראשון כדי להתחיל.
          </div>
        ) : (
          scenarios.map(scenario => (
            <div key={scenario.id} className="bg-white p-6 rounded-lg shadow-md border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{scenario.name}</h3>
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
                    onClick={() => window.location.href = `/scenarios/${scenario.id}`}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                  >
                    עריכה
                  </button>
                  <button
                    onClick={() => handleDelete(scenario.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
                  >
                    מחיקה
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">בנק שעות:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {scenario.hourBanks.map(bank => {
                    const hourType = hourTypes.find(ht => ht.id === bank.hourTypeId);
                    if (!hourType) return null;
                    
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
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
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
    </div>
  );
}