import { CreateHourTypeForm } from '@/types';

export const defaultHourTypes: CreateHourTypeForm[] = [
  {
    name: 'שעות הוראה',
    description: 'שעות הוראה רגילות בכיתה',
    color: '#3B82F6'
  },
  {
    name: 'שעות תיאום',
    description: 'שעות תיאום ותכנון עם צוות החינוך',
    color: '#10B981'
  },
  {
    name: 'שעות הכנה',
    description: 'שעות הכנת שיעורים ובדיקת עבודות',
    color: '#F59E0B'
  },
  {
    name: 'שעות פיקוח',
    description: 'שעות פיקוח על תלמידים (הפסקות, מרכזיות)',
    color: '#EF4444'
  },
  {
    name: 'שעות הדרכה',
    description: 'הדרכת מורים חדשים וסטודנטים',
    color: '#8B5CF6'
  },
  {
    name: 'שעות מנהליות',
    description: 'עבודה מנהלית, ישיבות צוות',
    color: '#6B7280'
  },
  {
    name: 'שעות תמיכה',
    description: 'תמיכה בתלמידים עם קשיים',
    color: '#EC4899'
  },
  {
    name: 'שעות חוגים',
    description: 'העשרה וחוגים אחר הצהריים',
    color: '#14B8A6'
  }
];

export const hebrewGrades = [
  'א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'',
  'ז\'', 'ח\'', 'ט\'', 'י\'', 'יא\'', 'יב\''
];

export const commonSubjects = [
  'מתמטיקה',
  'עברית',
  'אנגלית',
  'מדעים',
  'היסטוריה',
  'גיאוגרפיה',
  'חינוך גופני',
  'מוזיקה',
  'אמנות',
  'תנ״ך',
  'מחשבים',
  'טכנולוגיה'
];