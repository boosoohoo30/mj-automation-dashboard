import { getDb } from '../db/client.js';
import { v4 as uuid } from 'uuid';

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

export const EMOTIONS = ['natural', 'happy', 'sad', 'angry', 'shocked', 'loved'] as const;
export type Emotion = (typeof EMOTIONS)[number];

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
}

export interface Image {
  id: string;
  workflow_id: string;
  prompt: string;
  prompt_version: number;
  midjourney_job_id: string | null;
  file_path: string | null;
  thumbnail_path: string | null;
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
  grok_job_id: string | null;
  raw_file_path: string | null;
  optimized_path: string | null;
  gdrive_url: string | null;
  gdrive_file_id: string | null;
  file_size_bytes: number | null;
  ai_score: number | null;
  ai_feedback: string | null;
  human_status: 'pending' | 'approved' | 'rejected';
  human_feedback: string | null;
  iteration: number;
  created_at: string;
}

// --- Workflow CRUD ---

export function createWorkflow(taskName: string, slackChannel?: string, slackTs?: string): Workflow {
  const db = getDb();
  const id = uuid();
  db.prepare(`
    INSERT INTO workflows (id, task_name, slack_channel, slack_ts, status, current_step)
    VALUES (?, ?, ?, ?, 'pending', 1)
  `).run(id, taskName, slackChannel ?? null, slackTs ?? null);
  return getWorkflow(id)!;
}

export function getWorkflow(id: string): Workflow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM workflows WHERE id = ?').get(id) as Workflow | undefined;
}

export function listWorkflows(): Workflow[] {
  const db = getDb();
  return db.prepare('SELECT * FROM workflows ORDER BY created_at DESC').all() as Workflow[];
}

export function updateWorkflowStatus(id: string, status: WorkflowStatus): void {
  const db = getDb();
  const stepIndex = WORKFLOW_STEPS.indexOf(status);
  db.prepare(`
    UPDATE workflows SET status = ?, current_step = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(status, stepIndex + 1, id);
}

// --- Image CRUD ---

export function createImage(workflowId: string, prompt: string, iteration = 1): Image {
  const db = getDb();
  const id = uuid();
  db.prepare(`
    INSERT INTO images (id, workflow_id, prompt, iteration)
    VALUES (?, ?, ?, ?)
  `).run(id, workflowId, prompt, iteration);
  return db.prepare('SELECT * FROM images WHERE id = ?').get(id) as Image;
}

export function getImage(id: string): Image | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM images WHERE id = ?').get(id) as Image | undefined;
}

export function getWorkflowImages(workflowId: string): Image[] {
  const db = getDb();
  return db.prepare('SELECT * FROM images WHERE workflow_id = ? ORDER BY created_at DESC').all(workflowId) as Image[];
}

export function updateImage(id: string, fields: Partial<Image>): void {
  const db = getDb();
  const entries = Object.entries(fields).filter(([k]) => k !== 'id');
  if (entries.length === 0) return;
  const sets = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => v);
  db.prepare(`UPDATE images SET ${sets} WHERE id = ?`).run(...values, id);
}

// --- Video CRUD ---

export function createVideo(workflowId: string, imageId: string, emotion: Emotion, prompt: string): Video {
  const db = getDb();
  const id = uuid();
  db.prepare(`
    INSERT INTO videos (id, workflow_id, image_id, emotion, prompt)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, workflowId, imageId, emotion, prompt);
  return db.prepare('SELECT * FROM videos WHERE id = ?').get(id) as Video;
}

export function getVideo(id: string): Video | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM videos WHERE id = ?').get(id) as Video | undefined;
}

export function getWorkflowVideos(workflowId: string): Video[] {
  const db = getDb();
  return db.prepare('SELECT * FROM videos WHERE workflow_id = ? ORDER BY emotion, created_at DESC').all(workflowId) as Video[];
}

export function updateVideo(id: string, fields: Partial<Video>): void {
  const db = getDb();
  const entries = Object.entries(fields).filter(([k]) => k !== 'id');
  if (entries.length === 0) return;
  const sets = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => v);
  db.prepare(`UPDATE videos SET ${sets} WHERE id = ?`).run(...values, id);
}

// --- Feedback ---

export function addFeedback(workflowId: string, targetType: string, targetId: string, feedback: string, source = 'user'): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO feedback_log (id, workflow_id, target_type, target_id, feedback, source)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuid(), workflowId, targetType, targetId, feedback, source);
}

export function getFeedbackLog(workflowId: string): any[] {
  const db = getDb();
  return db.prepare('SELECT * FROM feedback_log WHERE workflow_id = ? ORDER BY created_at DESC').all(workflowId);
}
