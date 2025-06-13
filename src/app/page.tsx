export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            AcadeMaster
          </h1>
          <p className="text-xl text-gray-600">
            מערכת הקצאת שעות למורים
          </p>
          <p className="text-gray-500">
            ניהול שעות שבועיות וחלוקת משאבים לבית ספר יסודי
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-blue-600 text-3xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">ניהול תרחישים</h3>
            <p className="text-gray-600">
              יצירה ועריכה של תרחישי הקצאת שעות שונים
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-green-600 text-3xl mb-4">👨‍🏫</div>
            <h3 className="text-xl font-semibold mb-2">ניהול מורים</h3>
            <p className="text-gray-600">
              רישום ועריכת פרטי מורים והתמחויותיהם
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-purple-600 text-3xl mb-4">🏫</div>
            <h3 className="text-xl font-semibold mb-2">ניהול כיתות</h3>
            <p className="text-gray-600">
              הגדרת כיתות ודרישות שעות לכל מקצוע
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-orange-600 text-3xl mb-4">⏰</div>
            <h3 className="text-xl font-semibold mb-2">בנק שעות</h3>
            <p className="text-gray-600">
              ניהול בנק שעות לפי סוגים וחלוקה למורים
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-red-600 text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">דוחות</h3>
            <p className="text-gray-600">
              יצירת דוחות מפורטים על הקצאת השעות
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-indigo-600 text-3xl mb-4">🔄</div>
            <h3 className="text-xl font-semibold mb-2">השוואת תרחישים</h3>
            <p className="text-gray-600">
              השוואה בין תרחישי הקצאה שונים
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-colors">
            התחל עכשיו
          </button>
        </div>
      </div>
    </div>
  );
}