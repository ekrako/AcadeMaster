'use client';

import { useState, useEffect } from 'react';
import { Scenario, HourBank } from '@/types';
import { useHourTypes } from '@/contexts/HourTypesContext';

interface ScenarioEditFormProps {
  scenario: Scenario;
  onUpdate: (scenario: Scenario) => void;
  onCancel: () => void;
}

export default function ScenarioEditForm({ scenario, onUpdate, onCancel }: ScenarioEditFormProps) {
  const { hourTypes } = useHourTypes();
  const [formData, setFormData] = useState({
    name: scenario.name,
    description: scenario.description || '',
    isActive: scenario.isActive
  });
  const [hourBankData, setHourBankData] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize hour bank data from scenario
    const initialHourBanks: Record<string, number> = {};
    
    // First, initialize all current hour types with 0
    hourTypes.forEach(hourType => {
      initialHourBanks[hourType.id] = 0;
    });
    
    // Then, set values from existing hour banks
    scenario.hourBanks.forEach(bank => {
      if (hourTypes.find(ht => ht.id === bank.hourTypeId)) {
        initialHourBanks[bank.hourTypeId] = bank.totalHours;
      }
    });
    
    setHourBankData(initialHourBanks);
  }, [scenario, hourTypes]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'שם התרחיש הוא שדה חובה';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'שם התרחיש חייב להכיל לפחות 2 תווים';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'שם התרחיש לא יכול להכיל יותר מ-100 תווים';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Create updated hour banks
    const updatedHourBanks: HourBank[] = hourTypes.map(hourType => {
      const existingBank = scenario.hourBanks.find(bank => bank.hourTypeId === hourType.id);
      const newTotalHours = hourBankData[hourType.id] || 0;
      
      return {
        id: existingBank?.id || `bank-${scenario.id}-${hourType.id}`,
        hourTypeId: hourType.id,
        totalHours: newTotalHours,
        allocatedHours: existingBank?.allocatedHours || 0,
        remainingHours: newTotalHours - (existingBank?.allocatedHours || 0)
      };
    });

    const updatedScenario: Scenario = {
      ...scenario,
      name: formData.name.trim(),
      description: formData.description.trim(),
      isActive: formData.isActive,
      hourBanks: updatedHourBanks,
      updatedAt: new Date()
    };

    onUpdate(updatedScenario);
  };

  const handleHourBankChange = (hourTypeId: string, hours: number) => {
    setHourBankData(prev => ({
      ...prev,
      [hourTypeId]: Math.max(0, hours)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">עריכת פרטי תרחיש</h3>
        
        <div className="space-y-4">
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

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium">תרחיש פעיל</span>
            </label>
            <p className="text-gray-500 text-xs mt-1">
              תרחישים פעילים מוצגים בראש הרשימה
            </p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold mb-3">עדכון בנק שעות</h4>
        <p className="text-sm text-gray-600 mb-4">
          עדכן את כמות השעות הזמינה בכל סוג שעות. שים לב: שינוי כמות השעות עלול להשפיע על הקצאות קיימות.
        </p>
        
        {hourTypes.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-800">
              אין סוגי שעות מוגדרים. 
              <a href="/hour-types" className="underline mr-2">לחץ כאן להגדרת סוגי שעות</a>
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hourTypes.map(hourType => {
              const currentBank = scenario.hourBanks.find(bank => bank.hourTypeId === hourType.id);
              const allocatedHours = currentBank?.allocatedHours || 0;
              const newTotal = hourBankData[hourType.id] || 0;
              const willExceed = newTotal < allocatedHours;
              
              return (
                <div key={hourType.id} className={`border rounded-lg p-4 ${willExceed ? 'border-red-300 bg-red-50' : ''}`}>
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
                    max="999"
                    value={hourBankData[hourType.id] || 0}
                    onChange={(e) => handleHourBankChange(hourType.id, parseInt(e.target.value) || 0)}
                    className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      willExceed ? 'border-red-500' : ''
                    }`}
                    placeholder="מספר שעות"
                  />
                  <div className="mt-2 text-xs">
                    <span className="text-gray-600">הוקצו: {allocatedHours} שעות</span>
                    {willExceed && (
                      <p className="text-red-600 mt-1">
                        אזהרה: סך השעות החדש נמוך מהשעות שכבר הוקצו!
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          עדכן תרחיש
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}