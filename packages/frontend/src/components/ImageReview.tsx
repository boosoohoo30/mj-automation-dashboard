import { useState, useRef } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import type { Workflow, Image } from '../types/workflow';

export function ImageReview({ workflow }: { workflow: Workflow }) {
  const { reviewImage, uploadImage } = useWorkflowStore();
  const [feedback, setFeedback] = useState('');
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const images = workflow.images ?? [];
  const latestImage = selectedImage || images[0];

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await uploadImage(workflow.id, file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadImage(workflow.id, file);
    }
  };

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!latestImage) return;
    await reviewImage(latestImage.id, action, action === 'reject' ? feedback : undefined);
    setFeedback('');
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 space-y-4">
      <h2 className="text-lg font-semibold">이미지 검증</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Image preview */}
        <div
          className={`relative aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center ${
            dragOver ? 'ring-2 ring-blue-500' : ''
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {latestImage?.file_path ? (
            <img
              src={`/assets/${latestImage.file_path.split('/').pop()}`}
              alt="Generated"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-4">
              <p className="text-gray-500 mb-2">이미지를 여기에 드래그하거나</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                파일 선택
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Status badge */}
          {latestImage && (
            <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-bold ${
              latestImage.human_status === 'approved'
                ? 'bg-green-600'
                : latestImage.human_status === 'rejected'
                  ? 'bg-red-600'
                  : 'bg-yellow-600'
            }`}>
              {latestImage.human_status === 'approved' ? '승인됨' :
               latestImage.human_status === 'rejected' ? '거절됨' : '검토 대기'}
            </div>
          )}
        </div>

        {/* AI Assessment + Controls */}
        <div className="space-y-3">
          {/* Prompt */}
          {latestImage && (
            <div className="bg-gray-800 rounded p-3">
              <h4 className="text-xs font-semibold text-gray-400 mb-1">
                프롬프트 v{latestImage.prompt_version} (반복 #{latestImage.iteration})
              </h4>
              <p className="text-sm text-gray-300 break-all">{latestImage.prompt}</p>
            </div>
          )}

          {/* AI Score */}
          {latestImage?.ai_score != null && (
            <div className="bg-gray-800 rounded p-3">
              <h4 className="text-xs font-semibold text-gray-400 mb-1">AI 검증 결과</h4>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      latestImage.ai_score >= 0.8 ? 'bg-green-500' :
                      latestImage.ai_score >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${latestImage.ai_score * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono">{(latestImage.ai_score * 100).toFixed(0)}%</span>
              </div>
              {latestImage.ai_feedback && (
                <p className="text-xs text-gray-400">{latestImage.ai_feedback}</p>
              )}
            </div>
          )}

          {/* Review actions */}
          {latestImage && latestImage.human_status === 'pending' && (
            <div className="space-y-2">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="거절 시 피드백을 입력하세요..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleReview('approve')}
                  className="flex-1 px-3 py-2 bg-green-700 hover:bg-green-600 rounded text-sm font-medium"
                >
                  승인
                </button>
                <button
                  onClick={() => handleReview('reject')}
                  disabled={!feedback.trim()}
                  className="flex-1 px-3 py-2 bg-red-700 hover:bg-red-600 rounded text-sm font-medium disabled:opacity-50"
                >
                  거절 + 재생성
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image history */}
      {images.length > 1 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-400 mb-2">이전 버전</h4>
          <div className="flex gap-2 overflow-x-auto">
            {images.map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className={`flex-shrink-0 w-16 h-24 rounded overflow-hidden border-2 ${
                  img.id === latestImage?.id ? 'border-blue-500' : 'border-transparent'
                }`}
              >
                {img.file_path ? (
                  <img
                    src={`/assets/${img.file_path.split('/').pop()}`}
                    alt={`v${img.iteration}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs text-gray-500">
                    v{img.iteration}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
