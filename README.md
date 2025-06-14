# AcadeMaster - מערכת חלוקת שעות למורים

מערכת ניהול וחלוקת שעות הוראה לבתי ספר יסודיים, בנויה עם Next.js 14, TypeScript, Tailwind CSS ו-Firebase.

## תכונות עיקריות

- 🕐 **ניהול סוגי שעות** - יצירה וניהול של קטגוריות שעות גלובליות
- 📊 **תרחישי חלוקה** - יצירת סביבות חלוקה עצמאיות עם בנקי שעות
- 👥 **ניהול מורים וכיתות** - הוספה וניהול של מורים וכיתות בתוך התרחישים
- 📈 **דוחות ניתוח** - מעקב אחר ניצול שעות ויעילות החלוקה
- 📤 **ייצוא וייבוא** - העברת נתונים בין תרחישים שונים
- 🌐 **תמיכה מלאה בעברית** - ממשק RTL מותאם לעברית

## דרישות מערכת

- Node.js 18+ 
- npm או yarn
- Firebase project עם Firestore

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
   NEXT_PUBLIC_FIREBASE_DATABASE_ID=me-west1
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
3. הפעל Firestore Database:
   - בחר "Start in production mode"
   - בחר באזור `me-west1 (Middle East West 1)`
   - שם המסד: `me-west1`

### הגדרת כללי אבטחה

הוסף כללי אבטחה בסיסיים ל-Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
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
│   ├── database.ts      # פעולות מסד נתונים
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
- ודא שה-Database ID נכון

**שגיאות הרשאות Firestore:**
- בדק את כללי האבטחה במסד הנתונים
- ודא שהמשתמש מחובר כראוי

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