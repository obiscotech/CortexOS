import { DotGridBackground } from '../components/DotGridBackground';
import { MasterControlPanel } from '../components/MasterControlPanel';
import { ChatInterface } from '../components/ChatInterface';

export function MasterPage() {
  return (
    <div className="min-h-screen p-4">
      <DotGridBackground />
      
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MasterControlPanel />
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
