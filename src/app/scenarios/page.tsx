import ScenarioManagerWorking from '@/components/ScenarioManagerWorking';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ScenariosPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        <ScenarioManagerWorking />
      </div>
    </ProtectedRoute>
  );
}