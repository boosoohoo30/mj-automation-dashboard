import { Dashboard } from './components/Dashboard';
import { useWebSocket } from './hooks/useWebSocket';

export default function App() {
  const { connected } = useWebSocket();

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="border-b border-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-300">Workflow Automation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-500">{connected ? '연결됨' : '연결 끊김'}</span>
        </div>
      </header>

      {/* Main content */}
      <Dashboard />
    </div>
  );
}
