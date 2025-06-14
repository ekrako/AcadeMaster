import * as XLSX from 'xlsx';
import { ReportData, DetailedReportData } from './reports';

interface ExcelReportOptions {
  scenarioName: string;
  includeUtilization?: boolean;
  fileName?: string;
}

/**
 * Export report data to Excel file with Hebrew RTL support
 */
export function exportToExcel(
  reportData: ReportData,
  options: ExcelReportOptions
): void {
  const { hourTypes, teachers, matrix, hourTypeTotals, teacherTotals, grandTotal, hourBankTotals, hourBankUtilization } = reportData;
  const { scenarioName, includeUtilization = true, fileName } = options;

  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Prepare data for the sheet
  const sheetData: any[][] = [];
  
  // Header row with teacher names
  const headerRow = ['סוג שעה', ...teachers.map(t => t.name), 'סה"כ', 'אחוז'];
  sheetData.push(headerRow);
  
  // Data rows - each hour type with teacher allocations
  hourTypes.forEach((hourType, hourTypeIndex) => {
    const row = [
      hourType.name,
      ...matrix[hourTypeIndex],
      hourTypeTotals[hourTypeIndex],
      `${hourBankUtilization[hourTypeIndex]}%`
    ];
    sheetData.push(row);
  });
  
  // Totals row
  const totalBankHours = hourBankTotals.reduce((sum, hours) => sum + hours, 0);
  const overallUtilization = totalBankHours > 0 ? Math.round((grandTotal / totalBankHours) * 100) : 0;
  const totalsRow = ['סה"כ', ...teacherTotals, grandTotal, `${overallUtilization}%`];
  sheetData.push(totalsRow);
  
  // Add utilization row if requested
  if (includeUtilization) {
    const totalMaxHours = teachers.reduce((sum, teacher) => sum + teacher.maxHours, 0);
    const averageUtilization = totalMaxHours > 0 ? Math.round((grandTotal / totalMaxHours) * 100) : 0;
    
    const utilizationRow = [
      'אחוז ניצול',
      ...teachers.map((teacher, index) => {
        if (teacher.maxHours <= 0) return '0%';
        const percentage = Math.round((teacherTotals[index] / teacher.maxHours) * 100);
        return `${percentage}%`;
      }),
      `${averageUtilization}%`,
      '-'
    ];
    sheetData.push(utilizationRow);
  }
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  
  // Set column widths
  const colWidths = [
    { wch: 20 }, // Hour type column
    ...teachers.map(() => ({ wch: 15 })), // Teacher columns
    { wch: 12 }, // Total column
    { wch: 10 }  // Percentage column
  ];
  ws['!cols'] = colWidths;
  
  // Apply formatting
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  
  // Style header row
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };
    ws[cellAddress].s = {
      font: { bold: true, sz: 12 },
      fill: { fgColor: { rgb: '4472C4' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      }
    };
  }
  
  // Style totals row
  const totalsRowIndex = includeUtilization ? range.e.r - 1 : range.e.r;
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: totalsRowIndex, c: col });
    if (!ws[cellAddress]) ws[cellAddress] = { t: 'n', v: 0 };
    ws[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E7E6E6' } },
      border: {
        top: { style: 'thin', color: { rgb: '000000' } },
        bottom: { style: 'thin', color: { rgb: '000000' } },
        left: { style: 'thin', color: { rgb: '000000' } },
        right: { style: 'thin', color: { rgb: '000000' } }
      }
    };
  }
  
  // Style utilization row if present
  if (includeUtilization) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: range.e.r, c: col });
      if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };
      ws[cellAddress].s = {
        font: { italic: true },
        fill: { fgColor: { rgb: 'FFF2CC' } },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      };
    }
  }
  
  // Style data cells with borders
  for (let row = 1; row < (includeUtilization ? range.e.r : totalsRowIndex); row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      if (!ws[cellAddress]) ws[cellAddress] = { t: 'n', v: 0 };
      ws[cellAddress].s = {
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }
  }
  
  // Set RTL direction for the worksheet
  ws['!dir'] = 'rtl';
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'דוח הקצאת שעות');
  
  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const defaultFileName = `דוח_${scenarioName}_${timestamp}.xlsx`;
  const finalFileName = fileName || defaultFileName;
  
  // Save file
  XLSX.writeFile(wb, finalFileName);
}

/**
 * Create a simple summary report with scenario statistics
 */
export function exportSummaryToExcel(
  reportData: ReportData,
  scenarioName: string,
  fileName?: string
): void {
  const { teachers, teacherTotals, grandTotal } = reportData;
  
  const wb = XLSX.utils.book_new();
  
  // Summary data
  const summaryData = [
    ['סיכום התרחיש', scenarioName],
    ['', ''],
    ['מספר מורים', teachers.length],
    ['סה"כ שעות מוקצות', grandTotal],
    ['ממוצע שעות למורה', teachers.length > 0 ? Math.round(grandTotal / teachers.length) : 0],
    ['', ''],
    ['פירוט מורים:', ''],
    ['שם המורה', 'שעות מוקצות', 'מקסימום שעות', 'אחוז ניצול']
  ];
  
  // Add teacher details
  teachers.forEach((teacher, index) => {
    const allocatedHours = teacherTotals[index];
    const maxHours = teacher.maxHours;
    const utilization = maxHours > 0 ? Math.round((allocatedHours / maxHours) * 100) : 0;
    
    summaryData.push([
      teacher.name,
      allocatedHours,
      maxHours,
      `${utilization}%`
    ]);
  });
  
  const ws = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 }
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'סיכום');
  
  const timestamp = new Date().toISOString().split('T')[0];
  const defaultFileName = `סיכום_${scenarioName}_${timestamp}.xlsx`;
  const finalFileName = fileName || defaultFileName;
  
  XLSX.writeFile(wb, finalFileName);
}

/**
 * Export detailed class-level report to Excel
 */
export function exportDetailedToExcel(
  detailedReportData: DetailedReportData,
  scenarioName: string,
  fileName?: string
): void {
  const wb = XLSX.utils.book_new();
  
  // Create a sheet for each hour type
  detailedReportData.hourTypeBreakdowns.forEach((breakdown) => {
    const sheetData: any[][] = [];
    
    // Header
    sheetData.push([
      `פירוט ${breakdown.hourType.name}`,
      '',
      `סה"כ שעות: ${breakdown.totalHours}`
    ]);
    sheetData.push(['']); // Empty row
    
    // Table headers
    sheetData.push(['כיתה', 'מורה', 'שעות']);
    
    // Class allocations
    breakdown.classAllocations.forEach(allocation => {
      sheetData.push([
        allocation.className,
        allocation.teacherName,
        allocation.hours
      ]);
    });
    
    // Empty row before summary
    sheetData.push(['']);
    
    // Summary section
    sheetData.push([`סיכום ${breakdown.hourType.name}`, '', breakdown.totalHours]);
    
    // Teacher totals for this hour type
    sheetData.push(['']); // Empty row
    sheetData.push(['סיכום מורים:', '', '']);
    Object.entries(breakdown.teacherTotals).forEach(([teacherId, hours]) => {
      const teacher = detailedReportData.teachers.find(t => t.id === teacherId);
      sheetData.push([
        teacher?.name || 'לא זוהה',
        `ב${breakdown.hourType.name}`,
        hours
      ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Class name
      { wch: 25 }, // Teacher name
      { wch: 10 }  // Hours
    ];
    
    // Style the header row
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    // Style main header
    const headerCell = ws['A1'];
    if (headerCell) {
      headerCell.s = {
        font: { bold: true, sz: 14 },
        fill: { fgColor: { rgb: '4472C4' } },
        alignment: { horizontal: 'center' }
      };
    }
    
    // Style table headers
    for (let col = 0; col < 3; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 2, c: col });
      if (ws[cellAddress]) {
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'E7E6E6' } },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
      }
    }
    
    // Clean sheet name (remove invalid characters)
    const cleanSheetName = breakdown.hourType.name.replace(/[\\\/\?\*\[\]]/g, '_').substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);
  });
  
  // Create a summary sheet
  const summaryData: any[][] = [];
  summaryData.push(['סיכום כללי', scenarioName]);
  summaryData.push(['']); // Empty row
  
  // Teacher grand totals
  summaryData.push(['מורה', 'סה"כ שעות מוקצות']);
  Object.entries(detailedReportData.teacherGrandTotals).forEach(([teacherId, totalHours]) => {
    const teacher = detailedReportData.teachers.find(t => t.id === teacherId);
    summaryData.push([teacher?.name || 'לא זוהה', totalHours]);
  });
  
  summaryData.push(['']); // Empty row
  summaryData.push(['סה"כ כללי', detailedReportData.grandTotal]);
  
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 25 }, { wch: 15 }];
  
  // Style summary header
  if (summaryWs['A1']) {
    summaryWs['A1'].s = {
      font: { bold: true, sz: 14 },
      fill: { fgColor: { rgb: '4472C4' } }
    };
  }
  
  XLSX.utils.book_append_sheet(wb, summaryWs, 'סיכום כללי');
  
  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const defaultFileName = `דוח_פירוט_כיתות_${scenarioName}_${timestamp}.xlsx`;
  const finalFileName = fileName || defaultFileName;
  
  XLSX.writeFile(wb, finalFileName);
}