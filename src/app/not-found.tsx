import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          העמוד לא נמצא
        </h2>
        <p className="text-gray-600 mb-8">
          העמוד שאתה מחפש אינו קיים או הועבר למקום אחר
        </p>
        <Link
          href="/"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          חזור לעמוד הבית
        </Link>
      </div>
    </div>
  );
}