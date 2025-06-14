# AcadeMaster - מערכת חלוקת שעות למורים

מערכת ניהול וחלוקת שעות הוראה לבתי ספר יסודיים, בנויה עם Next.js 14, TypeScript, Tailwind CSS ו-Firebase Realtime Database.

## תכונות עיקריות

- 🕐 **ניהול סוגי שעות** - יצירה וניהול של קטגוריות שעות גלובליות
- 📊 **תרחישי חלוקה** - יצירת סביבות חלוקה עצמאיות עם בנקי שעות
- 👥 **ניהול מורים וכיתות** - הוספה וניהול של מורים וכיתות בתוך התרחישים
- ⚡ **הקצאת שעות חכמה** - הקצאה עם בדיקות תקינות ומעקב אחר בנקי שעות
- 📈 **דוחות ניתוח מפורטים** - דוחות עם אחוזי ניצול וייצוא לאקסל
- 📤 **ייצוא וייבוא** - העברת נתונים בין תרחישים שונים עם אימות
- 🔐 **אימות Google** - מערכת משתמשים מאובטחת עם הפרדת נתונים
- 🌐 **תמיכה מלאה בעברית** - ממשק RTL מותאם לעברית

## דרישות מערכת

- Node.js 18+ 
- npm או yarn
- Firebase project עם Realtime Database ו-Authentication

## התקנה

1. **שכפול הפרויקט:**
   ```bash
   git clone <repository-url>
   cd AcadeMaster
   ```

2. **התקנת תלויות:**
   ```bash
   npm install
   ```

3. **הגדרת Firebase:**
   - העתק את `.env.local.example` ל-`.env.local`
   - עדכן את ערכי Firebase מהקונסולה:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.europe-west1.firebasedatabase.app/
   ```

4. **הפעלת שרת הפיתוח:**
   ```bash
   npm run dev
   ```

הגש לכתובת [http://localhost:3000](http://localhost:3000) כדי לראות את האפליקציה.

## הגדרת Firebase

### יצירת פרויקט Firebase חדש

1. עבור ל[Firebase Console](https://console.firebase.google.com/)
2. צור פרויקט חדש או בחר פרויקט קיים
3. הפעל Realtime Database:
   - בחר "Create Database"
   - בחר באזור `europe-west1 (Belgium)`
   - בחר "Start in locked mode"
4. הפעל Authentication:
   - עבור ל-Authentication > Sign-in method
   - הפעל Google sign-in provider
   - הוסף את הדומיין שלך לרשימת הדומיינים המורשים

### הגדרת כללי אבטחה

הוסף כללי אבטחה בסיסיים ל-Realtime Database:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

## מבנה הפרויקט

```
src/
├── app/                 # Next.js App Router pages
│   ├── page.tsx         # דף הבית
│   ├── hour-types/      # ניהול סוגי שעות
│   └── scenarios/       # ניהול תרחישים
├── components/          # רכיבי React
│   ├── Navigation.tsx   # ניווט ראשי
│   ├── HourTypeManager.tsx
│   ├── ScenarioManager.tsx
│   └── ...
├── lib/                 # כלי עזר והגדרות
│   ├── firebase.ts      # הגדרת Firebase
│   ├── database.ts      # פעולות Realtime Database
│   ├── auth.ts          # פעולות אימות
│   ├── reports.ts       # מנוע דוחות
│   ├── reportExport.tsx # ייצוא דוחות לאקסל
│   └── ...
├── types/               # הגדרות TypeScript
└── contexts/            # React Contexts
```

## מודל הנתונים

### מושגי יסוד

- **סוגי שעות (Hour Types)**: קטגוריות גלובליות הניתנות לשימוש חוזר
- **תרחישים (Scenarios)**: סביבות חלוקה עצמאיות
- **בנקי שעות (Hour Banks)**: כמויות זמינות לכל סוג שעה בתרחיש
- **הקצאות (Allocations)**: הקצאת שעות למורים עבור כיתות ספציפיות

### זרימת העבודה

1. יצירת סוגי שעות גלובליים
2. יצירת תרחיש עם כמויות בנק שעות
3. הוספת מורים וכיתות לתרחיש
4. הקצאת שעות ממלאי הבנק למורים
5. יצירת דוחות ניתוח

## פקודות זמינות

```bash
npm run dev        # הפעלת שרת פיתוח
npm run build      # בנייה לייצור
npm run start      # הפעלת שרת ייצור
npm run lint       # בדיקת איכות קוד
```

## העברת נתונים (Migration)

אם יש לך נתונים קיימים שצריך להעביר לאזור me-west1, ראה [MIGRATION.md](./MIGRATION.md) להוראות מפורטות.

## תכונות RTL ועברית

- HTML עם `dir="rtl"` ו-`lang="he"`
- Tailwind CSS מותאם ל-RTL
- גופני עברית: Arial Hebrew, David, Times New Roman
- שימוש בכיתה `.rtl` לעיצוב ספציפי

## תמיכה וגאגים

### בעיות נפוצות

**שגיאת חיבור ל-Firebase:**
- ודא שהפרויקט קיים ב-Firebase Console
- בדק את נכונות המשתנים ב-`.env.local`
- ודא שה-DATABASE_URL נכון וכולל את האזור

**שגיאות הרשאות Realtime Database:**
- בדק את כללי האבטחה במסד הנתונים
- ודא שהמשתמש מחובר כראוי עם Google Authentication
- ודא שהכללים מאפשרים גישה לנתונים המשתמש בלבד

**בעיות RTL:**
- ודא שה-HTML כולל `dir="rtl"`
- השתמש בכיתות Tailwind המותאמות ל-RTL

### לוגים ודיבוג

ניתן להפעיל לוגים מפורטים ע"י הוספת משתנה סביבה:
```env
NEXT_PUBLIC_DEBUG=true
```

## תרומה לפרויקט

1. צור Fork של הפרויקט
2. צור ענף חדש: `git checkout -b feature/amazing-feature`
3. Commit השינויים: `git commit -m 'Add amazing feature'`
4. Push לענף: `git push origin feature/amazing-feature`
5. פתח Pull Request

## רישיון

פרויקט זה מופץ תחת רישיון MIT. ראה `LICENSE` לפרטים נוספים.

## קשר

לשאלות ותמיכה, פנה לצוות הפיתוח או פתח Issue בפרויקט.

---

**הערה:** מערכת זו פותחה במיוחד עבור בתי ספר יסודיים וכוללת תמיכה מלאה בעברית ומבנה RTL.