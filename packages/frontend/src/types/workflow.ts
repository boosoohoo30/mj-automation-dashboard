export const WORKFLOW_STEPS = [
  'pending',
  'fetching_concept',
  'generating_prompts',
  'generating_images',
  'reviewing_images',
  'uploading_images',
  'editing_images',
  'awaiting_image_feedback',
  'generating_video_prompts',
  'generating_videos',
  'reviewing_videos',
  'optimizing_videos',
  'uploading_videos',
  'awaiting_video_feedback',
  'completed',
] as const;

export type WorkflowStatus = (typeof WORKFLOW_STEPS)[number];

export const STEP_LABELS: Record<WorkflowStatus, string> = {
  pending: '대기',
  fetching_concept: '컨셉 가져오기',
  generating_prompts: '프롬프트 생성',
  generating_images: '이미지 생성 (Midjourney)',
  reviewing_images: '이미지 검증',
  uploading_images: '이미지 업로드 (위키)',
  editing_images: '이미지 편집',
  awaiting_image_feedback: '이미지 피드백 대기',
  generating_video_prompts: '영상 프롬프트 생성',
  generating_videos: '영상 생성 (Grok)',
  reviewing_videos: '영상 검증',
  optimizing_videos: '영상 최적화',
  uploading_videos: '영상 업로드 (Drive)',
  awaiting_video_feedback: '영상 피드백 대기',
  completed: '완료',
};

export const EMOTIONS = ['natural', 'happy', 'sad', 'angry', 'shocked', 'loved'] as const;
export type Emotion = (typeof EMOTIONS)[number];

export const EMOTION_LABELS: Record<Emotion, string> = {
  natural: '기본',
  happy: '행복',
  sad: '슬픔',
  angry: '화남',
  shocked: '놀람',
  loved: '사랑',
};

export interface Workflow {
  id: string;
  task_name: string;
  slack_channel: string | null;
  slack_ts: string | null;
  concept_url: string | null;
  concept_data: string | null;
  status: WorkflowStatus;
  current_step: number;
  created_at: string;
  updated_at: string;
  images?: Image[];
  videos?: Video[];
  feedback?: FeedbackEntry[];
}

export interface Image {
  id: string;
  workflow_id: string;
  prompt: string;
  prompt_version: number;
  file_path: string | null;
  confluence_url: string | null;
  ai_score: number | null;
  ai_feedback: string | null;
  human_status: 'pending' | 'approved' | 'rejected';
  human_feedback: string | null;
  iteration: number;
  created_at: string;
}

export interface Video {
  id: string;
  workflow_id: string;
  image_id: string | null;
  emotion: Emotion;
  prompt: string;
  raw_file_path: string | null;
  optimized_path: string | null;
  gdrive_url: string | null;
  file_size_bytes: number | null;
  ai_score: number | null;
  ai_feedback: string | null;
  human_status: 'pending' | 'approved' | 'rejected';
  human_feedback: string | null;
  iteration: number;
  created_at: string;
}

export interface FeedbackEntry {
  id: string;
  workflow_id: string;
  target_type: 'image' | 'video';
  target_id: string;
  feedback: string;
  source: string;
  action_taken: string | null;
  created_at: string;
}
