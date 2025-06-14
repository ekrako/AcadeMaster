import HourTypeManagerWorking from '@/components/HourTypeManagerWorking';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function HourTypesPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        <HourTypeManagerWorking />
      </div>
    </ProtectedRoute>
  );
}