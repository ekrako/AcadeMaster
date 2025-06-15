'use client';

import { useState, useEffect } from 'react';
import { Scenario, HourType, CreateScenarioForm, HourBank, ScenarioExport, ImportValidationResult } from '@/types';
import { 
  getScenarios, 
  getHourTypes, 
  createScenario, 
  deleteScenario,
  exportScenario,
  validateScenarioImport,
  importScenario,
  duplicateScenario
} from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { useFlash } from '@/contexts/FlashContext';

export default function ScenarioManager() {
  const { user } = useAuth();
  const { showFlash } = useFlash();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [hourTypes, setHourTypes] = useState<HourType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      const [scenariosData, hourTypesData] = await Promise.all([
        getScenarios(user.uid),
        getHourTypes(user.uid)
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

      await createScenario(user!.uid, newScenario);
      await loadData();
      resetForm();
    } catch (error) {
      console.error('Error creating scenario:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      showFlash('נדרש להתחבר כדי למחוק תרחיש', 'warning');
      return;
    }

    if (confirm('האם אתה בטוח שברצונך למחוק תרחיש זה?')) {
      try {
        await deleteScenario(user.uid, id);
        await loadData();
        showFlash('התרחיש נמחק בהצלחה', 'success');
      } catch (error) {
        console.error('Error deleting scenario:', error);
        showFlash(`שגיאה במחיקת התרחיש: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`, 'error');
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

  const handleExport = async (scenarioId: string) => {
    if (!user) {
      showFlash('נדרש להתחבר כדי לייצא תרחיש', 'warning');
      return;
    }

    try {
      const exportData = await exportScenario(user.uid, scenarioId);
      const scenario = scenarios.find(s => s.id === scenarioId);
      const filename = `${scenario?.name || 'תרחיש'}-${new Date().toISOString().split('T')[0]}.json`;
      
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
      showFlash(`שגיאה בייצוא התרחיש: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`, 'error');
    }
  };

  const handleDuplicate = async (scenarioId: string) => {
    if (!user) {
      showFlash('נדרש להתחבר כדי לשכפל תרחיש', 'warning');
      return;
    }

    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      showFlash('תרחיש לא נמצא', 'error');
      return;
    }

    if (confirm(`האם אתה רוצה לשכפל את התרחיש "${scenario.name}"? יווצר תרחיש חדש עם כל המורים, הכיתות וההקצאות.`)) {
      try {
        const newScenarioId = await duplicateScenario(user.uid, scenarioId);
        showFlash('התרחיש שוכפל בהצלחה!', 'success');
        // Refresh the scenarios list
        await loadData();
      } catch (error) {
        console.error('Error duplicating scenario:', error);
        showFlash(`שגיאה בשכפול התרחיש: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`, 'error');
      }
    }
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
      
      const validation = await validateScenarioImport(user!.uid, data);
      setImportData(data);
      setImportValidation(validation);
      setShowImportModal(true);
    } catch (error) {
      console.error('Error reading file:', error);
      showFlash('שגיאה בקריאת הקובץ. ודא שזהו קובץ JSON תקין.', 'error');
    }
    
    // Reset file input
    event.target.value = '';
  };

  const handleImport = async (createMissingHourTypes: boolean) => {
    if (!importData) return;
    
    setImporting(true);
    try {
      await importScenario(user!.uid, importData, createMissingHourTypes);
      await loadData();
      setShowImportModal(false);
      setImportData(null);
      setImportValidation(null);
      showFlash('התרחיש יובא בהצלחה!', 'success');
    } catch (error) {
      console.error('Error importing scenario:', error);
      alert('שגיאה בייבוא התרחיש');
    } finally {
      setImporting(false);
    }
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
        <div className="flex gap-3">
          <label className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg cursor-pointer">
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            disabled={hourTypes.length === 0}
          >
            צור תרחיש חדש
          </button>
        </div>
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
            <div 
              key={scenario.id} 
              className="bg-white p-6 rounded-lg shadow-md border cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => window.location.href = `/scenario?id=${scenario.id}`}
            >
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
                
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => window.location.href = `/scenario?id=${scenario.id}`}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                  >
                    עריכה
                  </button>
                  <button
                    onClick={() => handleDuplicate(scenario.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
                    title="שכפל תרחיש"
                  >
                    שכפול
                  </button>
                  <button
                    onClick={() => handleExport(scenario.id)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm"
                    title="ייצא תרחיש"
                  >
                    ייצוא
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
                  האם ברצונך ליצור את סוגי השעות החסרים?
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
              
              {importValidation.missingHourTypes.length > 0 && (
                <button
                  onClick={() => handleImport(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
                  disabled={importing}
                >
                  {importing ? 'מייבא...' : 'יבא וצור סוגי שעות חסרים'}
                </button>
              )}
              
              <button
                onClick={() => handleImport(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                disabled={importing || (importValidation.missingHourTypes.length > 0)}
                title={importValidation.missingHourTypes.length > 0 ? 'יש ליצור תחילה את סוגי השעות החסרים' : ''}
              >
                {importing ? 'מייבא...' : 'יבא תרחיש'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}