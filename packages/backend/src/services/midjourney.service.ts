import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { broadcast } from '../websocket/handler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, '../../assets');

// Midjourney has no official API.
// This service provides:
// 1. Prompt generation helper (formatting for MJ v6)
// 2. Manual mode: prompt copy + drag-drop upload
// Playwright browser automation can be added later.

export interface MidjourneyJob {
  id: string;
  prompt: string;
  status: 'pending' | 'submitted' | 'generating' | 'completed' | 'failed' | 'manual';
  imagePath?: string;
  error?: string;
}

// Format a prompt with Midjourney-specific parameters
export function formatMidjourneyPrompt(basePrompt: string, options?: {
  aspectRatio?: string;
  version?: string;
  quality?: number;
  stylize?: number;
}): string {
  const ar = options?.aspectRatio || '2:3';
  const version = options?.version || '6';

  let prompt = basePrompt.trim();

  // Remove existing parameters to avoid duplicates
  prompt = prompt.replace(/--ar\s+\S+/g, '').trim();
  prompt = prompt.replace(/--v\s+\S+/g, '').trim();

  // Add parameters
  prompt += ` --ar ${ar}`;
  prompt += ` --v ${version}`;

  if (options?.quality) {
    prompt += ` --q ${options.quality}`;
  }
  if (options?.stylize) {
    prompt += ` --s ${options.stylize}`;
  }

  return prompt;
}

// Create a pending job (manual mode)
// User will copy the prompt, generate in Midjourney web, then upload the result
export function createManualJob(prompt: string): MidjourneyJob {
  const id = crypto.randomUUID();
  const formatted = formatMidjourneyPrompt(prompt);

  broadcast('midjourney:prompt-ready', {
    id,
    prompt: formatted,
    message: 'Midjourney 프롬프트가 준비되었습니다. 복사 후 Midjourney에서 생성하세요.',
  });

  return {
    id,
    prompt: formatted,
    status: 'manual',
  };
}

// Save uploaded image from manual Midjourney process
export function saveUploadedImage(jobId: string, buffer: Buffer, filename: string): string {
  if (!existsSync(ASSETS_DIR)) {
    mkdirSync(ASSETS_DIR, { recursive: true });
  }

  const ext = filename.split('.').pop() || 'png';
  const savedPath = join(ASSETS_DIR, `mj_${jobId}.${ext}`);
  writeFileSync(savedPath, buffer);

  broadcast('midjourney:image-saved', { jobId, path: savedPath });
  return savedPath;
}
