import { useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { EMOTION_LABELS, type Emotion, type Workflow, type Video } from '../types/workflow';

function VideoCard({ video, onReview }: { video: Video; onReview: (id: string, action: 'approve' | 'reject', feedback?: string) => void }) {
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Video player */}
      <div className="aspect-[2/3] bg-gray-900 relative group">
        {video.raw_file_path || video.optimized_path ? (
          <video
            src={`/assets/${(video.optimized_path || video.raw_file_path)?.split('/').pop()}`}
            className="w-full h-full object-cover"
            muted
            loop
            onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
            onMouseLeave={(e) => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-600 text-sm">생성 중...</span>
          </div>
        )}

        {/* Status badge */}
        <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-xs font-bold ${
          video.human_status === 'approved' ? 'bg-green-600' :
          video.human_status === 'rejected' ? 'bg-red-600' : 'bg-yellow-600'
        }`}>
          {video.human_status === 'approved' ? 'OK' :
           video.human_status === 'rejected' ? 'NG' : '...'}
        </div>

        {/* AI score overlay */}
        {video.ai_score != null && (
          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-xs">
            AI: {(video.ai_score * 100).toFixed(0)}%
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{EMOTION_LABELS[video.emotion]}</span>
          {video.file_size_bytes && (
            <span className="text-xs text-gray-500">
              {(video.file_size_bytes / 1024 / 1024).toFixed(1)}MB
            </span>
          )}
        </div>

        {video.human_status === 'pending' && (video.raw_file_path || video.optimized_path) && (
          <div className="flex gap-1 mt-1">
            <button
              onClick={() => onReview(video.id, 'approve')}
              className="flex-1 px-2 py-1 bg-green-700 hover:bg-green-600 rounded text-xs"
            >
              승인
            </button>
            <button
              onClick={() => setShowFeedback(!showFeedback)}
              className="flex-1 px-2 py-1 bg-red-700 hover:bg-red-600 rounded text-xs"
            >
              거절
            </button>
          </div>
        )}

        {showFeedback && (
          <div className="mt-1 space-y-1">
            <input
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="피드백..."
              className="w-full px-2 py-1 bg-gray-900 border border-gray-700 rounded text-xs"
            />
            <button
              onClick={() => { onReview(video.id, 'reject', feedback); setShowFeedback(false); setFeedback(''); }}
              disabled={!feedback.trim()}
              className="w-full px-2 py-1 bg-red-700 rounded text-xs disabled:opacity-50"
            >
              거절 전송
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function VideoReview({ workflow }: { workflow: Workflow }) {
  const { reviewVideo, batchReviewVideos } = useWorkflowStore();
  const videos = workflow.videos ?? [];

  const pendingCount = videos.filter((v) => v.human_status === 'pending' && (v.raw_file_path || v.optimized_path)).length;

  return (
    <div className="bg-gray-900 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">영상 검증 (6감정)</h2>
        {pendingCount > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => batchReviewVideos(workflow.id, 'approve')}
              className="px-3 py-1 bg-green-700 hover:bg-green-600 rounded text-xs font-medium"
            >
              전체 승인 ({pendingCount})
            </button>
          </div>
        )}
      </div>

      {/* 2x3 grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onReview={(id, action, fb) => reviewVideo(id, action, fb)}
          />
        ))}
      </div>

      {videos.length === 0 && (
        <p className="text-gray-500 text-center py-4">영상 생성 대기 중...</p>
      )}
    </div>
  );
}
