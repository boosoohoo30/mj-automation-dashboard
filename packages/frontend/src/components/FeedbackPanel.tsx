import type { Workflow } from '../types/workflow';

export function FeedbackPanel({ workflow }: { workflow: Workflow }) {
  const feedback = workflow.feedback ?? [];

  return (
    <div className="bg-gray-900 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-400">피드백 기록</h3>

      {feedback.length === 0 && (
        <p className="text-gray-600 text-xs">아직 피드백이 없습니다.</p>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {feedback.map((entry) => (
          <div key={entry.id} className="bg-gray-800 rounded p-2">
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                entry.target_type === 'image' ? 'bg-purple-900 text-purple-300' : 'bg-cyan-900 text-cyan-300'
              }`}>
                {entry.target_type === 'image' ? '이미지' : '영상'}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(entry.created_at).toLocaleTimeString('ko-KR')}
              </span>
            </div>
            <p className="text-xs text-gray-300">{entry.feedback}</p>
            {entry.action_taken && (
              <p className="text-xs text-gray-500 mt-1">조치: {entry.action_taken}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
