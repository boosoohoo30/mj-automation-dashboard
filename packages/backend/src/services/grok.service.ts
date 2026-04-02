import { readFileSync } from 'fs';

const GROK_API_KEY = process.env.GROK_API_KEY || '';
const GROK_API_URL = 'https://api.x.ai/v1';

export interface VideoGenerationRequest {
  imageBase64: string;
  prompt: string;
  duration?: number;
  aspectRatio?: string;
}

export interface VideoGenerationResult {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
}

// Generate video from image using Grok API
export async function generateVideo(req: VideoGenerationRequest): Promise<VideoGenerationResult> {
  const res = await fetch(`${GROK_API_URL}/video/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-2-video',
      prompt: req.prompt,
      image: {
        type: 'base64',
        data: req.imageBase64,
      },
      duration: req.duration || 6,
      aspect_ratio: req.aspectRatio || '2:3',
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Grok API error: ${res.status} - ${errText}`);
  }

  const data = await res.json();
  return {
    jobId: data.id || data.job_id || '',
    status: 'pending',
    videoUrl: data.video_url || data.url,
  };
}

// Poll for video generation status
export async function checkVideoStatus(jobId: string): Promise<VideoGenerationResult> {
  const res = await fetch(`${GROK_API_URL}/video/generations/${jobId}`, {
    headers: {
      'Authorization': `Bearer ${GROK_API_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Grok status check error: ${res.status}`);
  }

  const data = await res.json();
  return {
    jobId,
    status: data.status === 'succeeded' ? 'completed' : data.status === 'failed' ? 'failed' : 'processing',
    videoUrl: data.video_url || data.url,
    error: data.error,
  };
}

// Download video from URL to local file
export async function downloadVideo(url: string, outputPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const { writeFileSync } = await import('fs');
  writeFileSync(outputPath, buffer);
}

// Generate all 6 emotion videos in parallel
export async function generateAllEmotionVideos(
  imagePath: string,
  emotionPrompts: Record<string, string>
): Promise<Record<string, VideoGenerationResult>> {
  const imageBuffer = readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString('base64');

  const entries = Object.entries(emotionPrompts);
  const results = await Promise.allSettled(
    entries.map(([emotion, prompt]) =>
      generateVideo({
        imageBase64,
        prompt,
        duration: 6,
        aspectRatio: '2:3',
      }).then((result) => ({ emotion, result }))
    )
  );

  const output: Record<string, VideoGenerationResult> = {};
  for (const r of results) {
    if (r.status === 'fulfilled') {
      output[r.value.emotion] = r.value.result;
    } else {
      const emotion = entries[results.indexOf(r)][0];
      output[emotion] = { jobId: '', status: 'failed', error: r.reason?.message };
    }
  }
  return output;
}
