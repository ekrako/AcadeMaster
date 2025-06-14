'use client';

import { useState, useEffect } from 'react';
import { Scenario, HourType } from '@/types';
import { 
  generateReportData, 
  generateDetailedReportData, 
  getScenarioSummary, 
  ReportData, 
  DetailedReportData 
} from '@/lib/reports';
import { exportToExcel, exportSummaryToExcel, exportDetailedToExcel } from '@/lib/reportExport';

interface ReportManagerProps {
  scenario: Scenario;
  hourTypes: HourType[];
}

export default function ReportManager({ scenario, hourTypes }: ReportManagerProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [detailedReportData, setDetailedReportData] = useState<DetailedReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

  useEffect(() => {
    generateReport();
  }, [scenario, hourTypes]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateReport = () => {
    setLoading(true);
    try {
      const data = generateReportData(scenario, hourTypes);
      const detailedData = generateDetailedReportData(scenario, hourTypes);
      setReportData(data);
      setDetailedReportData(detailedData);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    
    exportToExcel(reportData, {
      scenarioName: scenario.name,
      includeUtilization: true
    });
  };

  const handleExportSummary = () => {
    if (!reportData) return;
    
    exportSummaryToExcel(reportData, scenario.name);
  };

  const handleExportDetailed = () => {
    if (!detailedReportData) return;
    
    exportDetailedToExcel(detailedReportData, scenario.name);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!reportData || reportData.teachers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">דוחות התרחיש</h2>
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">📊</div>
          <p className="text-gray-600">אין נתונים להצגת דוח</p>
          <p className="text-sm text-gray-500 mt-2">
            נא להוסיף מורים והקצאות כדי ליצור דוח
          </p>
        </div>
      </div>
    );
  }

  const summary = getScenarioSummary(reportData);
  const { hourTypes: relevantHourTypes, teachers, matrix, hourTypeTotals, teacherTotals, grandTotal } = reportData;

  return (
    <div className="space-y-6">
      {/* Header and Export Buttons */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">דוחות התרחיש</h2>
          <div className="flex gap-2">
            <button
              onClick={handleExportSummary}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              📄 ייצא סיכום
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              📊 ייצא סיכום לאקסל
            </button>
            <button
              onClick={handleExportDetailed}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              📚 ייצא פירוט כיתות
            </button>
          </div>
        </div>
        
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summary.totalTeachers}</div>
            <div className="text-sm text-blue-700">מורים</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{summary.totalAllocatedHours}</div>
            <div className="text-sm text-green-700">סה"כ שעות</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{summary.averageUtilization}%</div>
            <div className="text-sm text-purple-700">ממוצע ניצול</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{relevantHourTypes.length}</div>
            <div className="text-sm text-orange-700">סוגי שעות</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {showDetails ? '🔼 הסתר פרטים' : '🔽 הצג פרטים'}
          </button>
          
          {showDetails && (
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('summary')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'summary'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                תצוגת סיכום
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'detailed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                תצוגת כיתות
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Report Table */}
      {showDetails && viewMode === 'summary' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">סיכום הקצאת שעות</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm" dir="rtl">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 text-right font-semibold">
                    סוג שעה
                  </th>
                  {teachers.map(teacher => (
                    <th key={teacher.id} className="border border-gray-300 px-3 py-2 text-center font-semibold min-w-[100px]">
                      {teacher.name}
                    </th>
                  ))}
                  <th className="border border-gray-300 px-3 py-2 text-center font-semibold bg-blue-50">
                    סה"כ
                  </th>
                </tr>
              </thead>
              <tbody>
                {relevantHourTypes.map((hourType, hourTypeIndex) => (
                  <tr key={hourType.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-3 py-2 font-medium text-right">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: hourType.color }}
                        ></div>
                        {hourType.name}
                      </div>
                    </td>
                    {teachers.map((teacher, teacherIndex) => (
                      <td key={teacher.id} className="border border-gray-300 px-3 py-2 text-center">
                        {matrix[hourTypeIndex][teacherIndex] || 0}
                      </td>
                    ))}
                    <td className="border border-gray-300 px-3 py-2 text-center font-semibold bg-blue-50">
                      {hourTypeTotals[hourTypeIndex]}
                    </td>
                  </tr>
                ))}
                <tr className="bg-blue-50 font-semibold">
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    סה"כ
                  </td>
                  {teachers.map((teacher, teacherIndex) => (
                    <td key={teacher.id} className="border border-gray-300 px-3 py-2 text-center">
                      {teacherTotals[teacherIndex]}
                    </td>
                  ))}
                  <td className="border border-gray-300 px-3 py-2 text-center bg-blue-100">
                    {grandTotal}
                  </td>
                </tr>
                <tr className="bg-yellow-50 text-sm">
                  <td className="border border-gray-300 px-3 py-2 text-right italic">
                    אחוז ניצול
                  </td>
                  {teachers.map((teacher, teacherIndex) => {
                    const utilization = teacher.maxHours > 0 
                      ? Math.round((teacherTotals[teacherIndex] / teacher.maxHours) * 100)
                      : 0;
                    const isOverAllocated = utilization > 100;
                    const isUnderUtilized = utilization < 80;
                    
                    return (
                      <td 
                        key={teacher.id} 
                        className={`border border-gray-300 px-3 py-2 text-center ${
                          isOverAllocated ? 'text-red-600 font-semibold' :
                          isUnderUtilized ? 'text-orange-600' : 'text-green-600'
                        }`}
                      >
                        {utilization}%
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {summary.averageUtilization}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span>80-100% ניצול אופטימלי</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
              <span>פחות מ-80% תת ניצול</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
              <span>מעל 100% הקצאת יתר</span>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Class-Level Report */}
      {showDetails && viewMode === 'detailed' && detailedReportData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">פירוט הקצאות לפי כיתות</h3>
          
          <div className="space-y-6">
            {detailedReportData.hourTypeBreakdowns.map((breakdown) => (
              <div key={breakdown.hourType.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: breakdown.hourType.color }}
                  ></div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {breakdown.hourType.name}
                  </h4>
                  <span className="text-sm text-gray-500">
                    (סה"כ {breakdown.totalHours} שעות)
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm" dir="rtl">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-3 py-2 text-right font-semibold">
                          כיתה
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-right font-semibold">
                          מורה
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-semibold">
                          שעות
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakdown.classAllocations.map((allocation, index) => (
                        <tr key={`${allocation.classId}-${allocation.teacherId}-${index}`} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2 text-right">
                            {allocation.className}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-right">
                            {allocation.teacherName}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            {allocation.hours}
                          </td>
                        </tr>
                      ))}
                      
                      {/* Summary row for this hour type */}
                      <tr className="bg-blue-50 font-semibold">
                        <td className="border border-gray-300 px-3 py-2 text-right" colSpan={2}>
                          סיכום {breakdown.hourType.name}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {breakdown.totalHours}
                        </td>
                      </tr>
                      
                      {/* Teacher totals for this hour type */}
                      {Object.entries(breakdown.teacherTotals).map(([teacherId, hours]) => {
                        const teacher = detailedReportData.teachers.find(t => t.id === teacherId);
                        return (
                          <tr key={`teacher-${teacherId}`} className="bg-gray-100 text-sm">
                            <td className="border border-gray-300 px-3 py-2 text-right italic">
                              סה"כ {teacher?.name || 'לא זוהה'}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-right italic">
                              ב{breakdown.hourType.name}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center font-medium">
                              {hours}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            
            {/* Grand Total Summary */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-blue-900 mb-3">סיכום כללי</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-blue-800 mb-2">סה"כ שעות למורים:</h5>
                  <div className="space-y-1 text-sm">
                    {Object.entries(detailedReportData.teacherGrandTotals).map(([teacherId, totalHours]) => {
                      const teacher = detailedReportData.teachers.find(t => t.id === teacherId);
                      return (
                        <div key={teacherId} className="flex justify-between">
                          <span>{teacher?.name || 'לא זוהה'}:</span>
                          <span className="font-medium">{totalHours} שעות</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {detailedReportData.grandTotal}
                    </div>
                    <div className="text-sm text-blue-700">סה"כ שעות מוקצות</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Statistics */}
      {showDetails && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">סטטיסטיקות נוספות</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">איכות ההקצאה</h4>
              <div className="space-y-1 text-sm">
                <div>מורים עם הקצאת יתר: {summary.teachersOverAllocated}</div>
                <div>מורים עם תת ניצול: {summary.teachersUnderUtilized}</div>
                <div>איזון כללי: {summary.averageUtilization}%</div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">פילוח שעות</h4>
              <div className="space-y-1 text-sm">
                <div>סה"כ שעות זמינות: {summary.totalMaxHours}</div>
                <div>סה"כ שעות מוקצות: {summary.totalAllocatedHours}</div>
                <div>שעות לא מנוצלות: {summary.totalMaxHours - summary.totalAllocatedHours}</div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">ממוצעים</h4>
              <div className="space-y-1 text-sm">
                <div>ממוצע שעות למורה: {teachers.length > 0 ? Math.round(grandTotal / teachers.length) : 0}</div>
                <div>ממוצע שעות לסוג: {relevantHourTypes.length > 0 ? Math.round(grandTotal / relevantHourTypes.length) : 0}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}