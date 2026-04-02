import { useEffect, useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';
import { STEP_LABELS, WORKFLOW_STEPS, type WorkflowStatus } from '../types/workflow';
import { ImageReview } from './ImageReview';
import { VideoReview } from './VideoReview';
import { PromptEditor } from './PromptEditor';
import { FeedbackPanel } from './FeedbackPanel';
import { UploadStatus } from './UploadStatus';

function StepIndicator({
  status,
  onStepClick,
}: {
  status: WorkflowStatus;
  onStepClick: (step: WorkflowStatus) => void;
}) {
  const activeIdx = WORKFLOW_STEPS.indexOf(status);
  return (
    <div className="flex flex-col gap-1 p-4 bg-gray-900 rounded-lg">
      <h3 className="text-sm font-semibold text-gray-400 mb-2">워크플로우 진행 상태</h3>
      <div className="flex flex-wrap gap-1">
        {WORKFLOW_STEPS.map((step, i) => {
          const isActive = step === status;
          const isDone = i < activeIdx;
          return (
            <button
              key={step}
              onClick={() => onStepClick(step)}
              className={`px-2 py-1 rounded text-xs font-medium transition-all cursor-pointer hover:ring-1 hover:ring-gray-500 ${
                isActive
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : isDone
                    ? 'bg-green-900 text-green-300'
                    : 'bg-gray-800 text-gray-500'
              }`}
            >
              {STEP_LABELS[step]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConceptInput({ workflow }: { workflow: { id: string } }) {
  const [url, setUrl] = useState('');
  const { updateStatus } = useWorkflowStore();

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-4">
      <h2 className="text-lg font-semibold">컨셉 가져오기</h2>
      <p className="text-sm text-gray-400">Confluence 페이지 URL 또는 컨셉 설명을 입력하세요.</p>
      <textarea
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Confluence URL 또는 컨셉 설명..."
        className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex gap-2">
        <button
          onClick={() => updateStatus(workflow.id, 'generating_prompts')}
          disabled={!url.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-medium text-sm disabled:opacity-50"
        >
          컨셉 확인 완료 → 프롬프트 생성
        </button>
      </div>
    </div>
  );
}

function StepActions({ workflowId, status }: { workflowId: string; status: WorkflowStatus }) {
  const { updateStatus } = useWorkflowStore();
  const idx = WORKFLOW_STEPS.indexOf(status);
  const nextStep = idx < WORKFLOW_STEPS.length - 1 ? WORKFLOW_STEPS[idx + 1] : null;
  const prevStep = idx > 0 ? WORKFLOW_STEPS[idx - 1] : null;

  if (status === 'completed') return null;

  return (
    <div className="flex gap-2 justify-end">
      {prevStep && (
        <button
          onClick={() => updateStatus(workflowId, prevStep)}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs"
        >
          &larr; 이전 단계
        </button>
      )}
      {nextStep && (
        <button
          onClick={() => updateStatus(workflowId, nextStep)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium"
        >
          다음 단계 &rarr;
        </button>
      )}
    </div>
  );
}

export function Dashboard() {
  const {
    workflows,
    activeWorkflow,
    loading,
    fetchWorkflows,
    fetchWorkflow,
    createWorkflow,
    updateStatus,
  } = useWorkflowStore();
  const [newTaskName, setNewTaskName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleCreate = async () => {
    if (!newTaskName.trim()) return;
    const wf = await createWorkflow(newTaskName.trim());
    setNewTaskName('');
    setShowCreate(false);
    fetchWorkflow(wf.id);
  };

  // Active workflow detail view
  if (activeWorkflow) {
    const status = activeWorkflow.status;
    return (
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => useWorkflowStore.setState({ activeWorkflow: null })}
              className="text-gray-400 hover:text-white text-sm"
            >
              &larr; 목록
            </button>
            <h1 className="text-xl font-bold">{activeWorkflow.task_name}</h1>
            <span className="px-2 py-0.5 bg-blue-900 text-blue-300 rounded text-xs">
              {STEP_LABELS[status]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <StepActions workflowId={activeWorkflow.id} status={status} />
            <span className="text-xs text-gray-500">
              {new Date(activeWorkflow.created_at).toLocaleString('ko-KR')}
            </span>
          </div>
        </div>

        {/* Step indicator */}
        <StepIndicator
          status={status}
          onStepClick={(step) => updateStatus(activeWorkflow.id, step)}
        />

        {/* Context-dependent panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Concept input */}
            {(status === 'pending' || status === 'fetching_concept') && (
              <ConceptInput workflow={activeWorkflow} />
            )}

            {/* Prompt editor */}
            {(status === 'generating_prompts' || status === 'generating_video_prompts') && (
              <PromptEditor workflow={activeWorkflow} />
            )}

            {/* Image review */}
            {(status === 'generating_images' || status === 'reviewing_images' ||
              status === 'editing_images' || status === 'awaiting_image_feedback') && (
              <ImageReview workflow={activeWorkflow} />
            )}

            {/* Upload status (images) */}
            {status === 'uploading_images' && (
              <UploadStatus workflow={activeWorkflow} />
            )}

            {/* Video review */}
            {(status === 'generating_videos' || status === 'reviewing_videos' || status === 'optimizing_videos') && (
              <VideoReview workflow={activeWorkflow} />
            )}

            {/* Upload status (videos) */}
            {(status === 'uploading_videos' || status === 'awaiting_video_feedback') && (
              <UploadStatus workflow={activeWorkflow} />
            )}

            {/* Completed */}
            {status === 'completed' && (
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-8 text-center">
                <p className="text-green-300 text-lg font-semibold">워크플로우 완료!</p>
                <p className="text-gray-400 mt-2">모든 이미지와 영상이 업로드되었습니다.</p>
              </div>
            )}
          </div>

          {/* Sidebar: feedback + history */}
          <div className="space-y-4">
            <FeedbackPanel workflow={activeWorkflow} />

            {/* Quick stats */}
            <div className="bg-gray-900 rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-400">현황</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-800 rounded p-2">
                  <span className="text-gray-500">이미지</span>
                  <p className="text-lg font-bold">{activeWorkflow.images?.length || 0}</p>
                </div>
                <div className="bg-gray-800 rounded p-2">
                  <span className="text-gray-500">영상</span>
                  <p className="text-lg font-bold">{activeWorkflow.videos?.length || 0}</p>
                </div>
                <div className="bg-gray-800 rounded p-2">
                  <span className="text-gray-500">승인됨</span>
                  <p className="text-lg font-bold text-green-400">
                    {(activeWorkflow.images?.filter((i) => i.human_status === 'approved').length || 0) +
                     (activeWorkflow.videos?.filter((v) => v.human_status === 'approved').length || 0)}
                  </p>
                </div>
                <div className="bg-gray-800 rounded p-2">
                  <span className="text-gray-500">피드백</span>
                  <p className="text-lg font-bold text-yellow-400">
                    {activeWorkflow.feedback?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Workflow list view
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">업무 자동화 대시보드</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-medium text-sm"
        >
          + 새 워크플로우
        </button>
      </div>

      {/* Create dialog */}
      {showCreate && (
        <div className="mb-4 p-4 bg-gray-900 rounded-lg flex gap-2">
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="태스크 이름 입력..."
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 rounded text-sm font-medium">
            생성
          </button>
          <button onClick={() => { setShowCreate(false); setNewTaskName(''); }} className="px-4 py-2 bg-gray-700 rounded text-sm">
            취소
          </button>
        </div>
      )}

      {/* Workflow list */}
      {loading && <p className="text-gray-500">로딩 중...</p>}
      <div className="space-y-2">
        {workflows.map((wf) => (
          <div
            key={wf.id}
            onClick={() => fetchWorkflow(wf.id)}
            className="p-4 bg-gray-900 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors flex items-center justify-between"
          >
            <div>
              <h3 className="font-medium">{wf.task_name}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(wf.created_at).toLocaleString('ko-KR')}
              </p>
            </div>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                wf.status === 'completed'
                  ? 'bg-green-900 text-green-300'
                  : 'bg-blue-900 text-blue-300'
              }`}
            >
              {STEP_LABELS[wf.status]}
            </span>
          </div>
        ))}
        {!loading && workflows.length === 0 && (
          <p className="text-gray-500 text-center py-8">아직 워크플로우가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
