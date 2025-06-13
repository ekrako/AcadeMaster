'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import TeacherManagerWorking from '@/components/TeacherManagerWorking';
import ClassManagerWorking from '@/components/ClassManagerWorking';
import ScenarioEditForm from '@/components/ScenarioEditForm';
import AllocationManagerWorking from '@/components/AllocationManagerWorking';
import ClassAllocationDisplay from '@/components/ClassAllocationDisplay';
import { Scenario, Teacher, Class, HourBank } from '@/types';
import { useHourTypes } from '@/contexts/HourTypesContext';

export default function ScenarioDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { hourTypes } = useHourTypes();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'teachers' | 'classes' | 'allocations' | 'class-view' | 'reports'>('overview');
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    loadScenario();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadScenario = async () => {
    try {
      // Simulate loading scenario from storage/API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check localStorage for scenarios
      const stored = localStorage.getItem('academaster-scenarios');
      if (stored) {
        const scenarios = JSON.parse(stored);
        const foundScenario = scenarios.find((s: any) => s.id === id);
        if (foundScenario) {
          // Convert dates
          foundScenario.createdAt = new Date(foundScenario.createdAt);
          foundScenario.updatedAt = new Date(foundScenario.updatedAt);
          setScenario(foundScenario);
        } else {
          // Create mock scenario
          const mockScenario: Scenario = {
            id,
            name: `תרחיש #${id}`,
            description: 'תרחיש בדיקה',
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: false,
            hourBanks: createHourBanksFromTypes(),
            teachers: [],
            classes: [],
            allocations: []
          };
          setScenario(mockScenario);
        }
      } else {
        // Create mock scenario
        const mockScenario: Scenario = {
          id,
          name: `תרחיש #${id}`,
          description: 'תרחיש בדיקה',
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: false,
          hourBanks: createHourBanksFromTypes(),
          teachers: [],
          classes: [],
          allocations: []
        };
        setScenario(mockScenario);
      }
    } catch (error) {
      console.error('Error loading scenario:', error);
    } finally {
      setLoading(false);
    }
  };

  const createHourBanksFromTypes = (): HourBank[] => {
    return hourTypes.map(hourType => ({
      id: `bank-${id}-${hourType.id}`,
      hourTypeId: hourType.id,
      totalHours: 0,
      allocatedHours: 0,
      remainingHours: 0
    }));
  };

  const saveScenario = (scenarioToSave: Scenario) => {
    const stored = localStorage.getItem('academaster-scenarios');
    let scenarios = stored ? JSON.parse(stored) : [];
    
    const index = scenarios.findIndex((s: any) => s.id === scenarioToSave.id);
    if (index >= 0) {
      scenarios[index] = scenarioToSave;
    } else {
      scenarios.push(scenarioToSave);
    }
    
    localStorage.setItem('academaster-scenarios', JSON.stringify(scenarios));
  };

  const handleTeachersUpdate = (teachers: Teacher[]) => {
    if (!scenario) return;
    const updatedScenario = { ...scenario, teachers, updatedAt: new Date() };
    setScenario(updatedScenario);
    saveScenario(updatedScenario);
  };

  const handleClassesUpdate = (classes: Class[]) => {
    if (!scenario) return;
    const updatedScenario = { ...scenario, classes, updatedAt: new Date() };
    setScenario(updatedScenario);
    saveScenario(updatedScenario);
  };

  const handleScenarioUpdate = (updatedScenario: Scenario) => {
    setScenario(updatedScenario);
    saveScenario(updatedScenario);
    setShowEditForm(false);
    
    // Update page title
    if (typeof document !== 'undefined') {
      document.title = `${updatedScenario.name} - AcadeMaster`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">טוען תרחיש...</div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="container mx-auto py-8 px-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">תרחיש לא נמצא</h2>
          <p className="text-red-600 mb-4">התרחיש המבוקש לא נמצא במערכת</p>
          <Link href="/scenarios" className="text-red-700 underline hover:text-red-900">
            חזור לרשימת התרחישים
          </Link>
        </div>
      </div>
    );
  }

  // Set page title
  if (typeof document !== 'undefined') {
    document.title = `${scenario.name} - AcadeMaster`;
  }

  return (
    <div className="container mx-auto py-8 px-6">
      <div className="mb-6">
        <Link 
          href="/scenarios" 
          className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-2"
        >
          ← חזור לתרחישים
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{scenario.name}</h1>
              {scenario.isActive && (
                <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                  פעיל
                </span>
              )}
            </div>
            {scenario.description && (
              <p className="text-gray-600 mt-2">{scenario.description}</p>
            )}
          </div>
          <button
            onClick={() => setShowEditForm(true)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            ⚙️ עריכת תרחיש
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            סקירה כללית
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'teachers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            מורים ({scenario.teachers.length})
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'classes'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            כיתות ({scenario.classes.length})
          </button>
          <button
            onClick={() => setActiveTab('allocations')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'allocations'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            הקצאות ({scenario.allocations.length})
          </button>
          <button
            onClick={() => setActiveTab('class-view')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'class-view'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            תצוגת כיתות
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 px-1 border-b-2 transition-colors ${
              activeTab === 'reports'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            דוחות
          </button>
        </nav>
      </div>

      {/* Edit Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <ScenarioEditForm
              scenario={scenario}
              onUpdate={handleScenarioUpdate}
              onCancel={() => setShowEditForm(false)}
            />
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="grid gap-6">
        {activeTab === 'overview' && (
          <>
            {/* Scenario Overview */}
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h2 className="text-xl font-semibold mb-4">סקירת התרחיש</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('teachers')}
                  className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors text-right cursor-pointer border-2 border-transparent hover:border-blue-200"
                >
                  <h3 className="font-medium text-blue-800">מורים</h3>
                  <div className="text-2xl font-bold text-blue-600">{scenario.teachers.length}</div>
                  <p className="text-sm text-blue-600">רשומים בתרחיש</p>
                </button>
                <button
                  onClick={() => setActiveTab('classes')}
                  className="bg-green-50 p-4 rounded-lg hover:bg-green-100 transition-colors text-right cursor-pointer border-2 border-transparent hover:border-green-200"
                >
                  <h3 className="font-medium text-green-800">כיתות</h3>
                  <div className="text-2xl font-bold text-green-600">{scenario.classes.length}</div>
                  <p className="text-sm text-green-600">מוגדרות בתרחיש</p>
                </button>
                <button
                  onClick={() => setActiveTab('allocations')}
                  className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition-colors text-right cursor-pointer border-2 border-transparent hover:border-purple-200"
                >
                  <h3 className="font-medium text-purple-800">הקצאות</h3>
                  <div className="text-2xl font-bold text-purple-600">{scenario.allocations.length}</div>
                  <p className="text-sm text-purple-600">הקצאות פעילות</p>
                </button>
              </div>
            </div>

            {/* Hour Banks */}
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h2 className="text-xl font-semibold mb-4">בנק שעות</h2>
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {scenario.hourBanks.map(bank => {
                  const hourType = hourTypes.find(ht => ht.id === bank.hourTypeId);
                  if (!hourType) return null;
                  
                  const utilizationPercent = bank.totalHours > 0 ? (bank.allocatedHours / bank.totalHours) * 100 : 0;
                  
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
                        {bank.remainingHours}/{bank.totalHours}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">שעות נותרו/סה״כ</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all" 
                          style={{ width: `${utilizationPercent}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round(utilizationPercent)}% בשימוש
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow-md border">
              <h2 className="text-xl font-semibold mb-4">פעולות מהירות</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => setActiveTab('teachers')}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg text-center transition-colors"
                >
                  <div className="text-2xl mb-2">👨‍🏫</div>
                  <div className="font-medium">ניהול מורים</div>
                  <div className="text-sm opacity-90">הוסף ונהל מורים</div>
                </button>
                
                <button 
                  onClick={() => setActiveTab('classes')}
                  className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg text-center transition-colors"
                >
                  <div className="text-2xl mb-2">🏫</div>
                  <div className="font-medium">ניהול כיתות</div>
                  <div className="text-sm opacity-90">הוסף ונהל כיתות</div>
                </button>
                
                <button 
                  onClick={() => setActiveTab('allocations')}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg text-center transition-colors"
                >
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="font-medium">הקצאת שעות</div>
                  <div className="text-sm opacity-90">הקצה שעות למורים</div>
                </button>
                
                <button 
                  onClick={() => setActiveTab('reports')}
                  className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg text-center transition-colors"
                >
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-medium">דוחות</div>
                  <div className="text-sm opacity-90">צפה בדוחות ונתונים</div>
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'teachers' && (
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <TeacherManagerWorking
              scenarioId={scenario.id}
              teachers={scenario.teachers}
              onUpdate={handleTeachersUpdate}
              scenario={scenario}
              onScenarioUpdate={handleScenarioUpdate}
            />
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <ClassManagerWorking
              scenarioId={scenario.id}
              classes={scenario.classes}
              onUpdate={handleClassesUpdate}
              teachers={scenario.teachers}
            />
          </div>
        )}

        {activeTab === 'allocations' && (
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <AllocationManagerWorking
              scenario={scenario}
              onUpdate={handleScenarioUpdate}
            />
          </div>
        )}

        {activeTab === 'class-view' && (
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <ClassAllocationDisplay scenario={scenario} />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <div className="text-yellow-600 text-4xl mb-4">🚧</div>
            <h3 className="text-xl font-semibold text-yellow-800 mb-2">בפיתוח</h3>
            <p className="text-yellow-700">
              מערכת הדוחות תהיה זמינה בקרוב.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}