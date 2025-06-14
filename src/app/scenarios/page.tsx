import ScenarioManager from '@/components/ScenarioManager';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function ScenariosPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        <ScenarioManager />
      </div>
    </ProtectedRoute>
  );
}