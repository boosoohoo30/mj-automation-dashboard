import { Router } from 'express';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  createImage,
  updateImage,
  getImage,
  createVideo,
  updateVideo,
  getVideo,
  getWorkflow,
  getWorkflowImages,
  getWorkflowVideos,
  updateWorkflowStatus,
  EMOTIONS,
} from '../workflow/engine.js';
import { broadcast } from '../websocket/handler.js';
import { formatMidjourneyPrompt, createManualJob } from '../services/midjourney.service.js';
import { optimizeVideo } from '../services/ffmpeg.service.js';
import { prepareUploadMetadata } from '../services/gdrive.service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '../../assets');

const upload = multer({ dest: assetsDir });

const router = Router();

// Manual image upload (fallback when Playwright fails)
router.post('/image/upload/:workflowId', upload.single('image'), (req, res) => {
  const workflow = getWorkflow(req.params.workflowId);
  if (!workflow) {
    res.status(404).json({ error: 'Workflow not found' });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const prompt = (req.body.prompt as string) || 'manually uploaded';
  const image = createImage(workflow.id, prompt);
  updateImage(image.id, { file_path: file.path });

  broadcast('image:uploaded', { ...image, file_path: file.path });
  res.status(201).json({ ...image, file_path: file.path });
});

// Manual video upload
router.post('/video/upload/:workflowId', upload.single('video'), (req, res) => {
  const workflow = getWorkflow(req.params.workflowId);
  if (!workflow) {
    res.status(404).json({ error: 'Workflow not found' });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const { emotion, prompt, image_id } = req.body;
  if (!emotion || !prompt) {
    res.status(400).json({ error: 'emotion and prompt are required' });
    return;
  }

  const video = createVideo(workflow.id, image_id, emotion, prompt);
  updateVideo(video.id, { raw_file_path: file.path });

  broadcast('video:uploaded', { ...video, raw_file_path: file.path });
  res.status(201).json({ ...video, raw_file_path: file.path });
});

// Generate Midjourney prompt (manual mode)
router.post('/midjourney/prompt', (req, res) => {
  const { prompt, workflowId } = req.body;
  if (!prompt) {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }

  const formatted = formatMidjourneyPrompt(prompt);
  const job = createManualJob(prompt);

  // Create image record
  if (workflowId) {
    const image = createImage(workflowId, formatted);
    res.json({ ...job, imageId: image.id });
  } else {
    res.json(job);
  }
});

// Optimize a video with ffmpeg
router.post('/video/optimize/:videoId', async (req, res) => {
  const video = getVideo(req.params.videoId);
  if (!video) {
    res.status(404).json({ error: 'Video not found' });
    return;
  }

  if (!video.raw_file_path) {
    res.status(400).json({ error: 'No raw video file to optimize' });
    return;
  }

  const outputPath = join(assetsDir, `optimized_${video.id}.mp4`);

  try {
    const result = await optimizeVideo({
      inputPath: video.raw_file_path,
      outputPath,
    });

    updateVideo(video.id, {
      optimized_path: result.outputPath,
      file_size_bytes: result.fileSizeBytes,
    });

    const updated = getVideo(video.id);
    broadcast('video:optimized', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Batch optimize all videos for a workflow
router.post('/videos/optimize/:workflowId', async (req, res) => {
  const videos = getWorkflowVideos(req.params.workflowId);
  const approvedVideos = videos.filter(
    (v) => v.human_status === 'approved' && v.raw_file_path && !v.optimized_path
  );

  const results = [];
  for (const video of approvedVideos) {
    try {
      const outputPath = join(assetsDir, `optimized_${video.id}.mp4`);
      const result = await optimizeVideo({
        inputPath: video.raw_file_path!,
        outputPath,
      });
      updateVideo(video.id, {
        optimized_path: result.outputPath,
        file_size_bytes: result.fileSizeBytes,
      });
      results.push({ id: video.id, success: true, ...result });
    } catch (err) {
      results.push({ id: video.id, success: false, error: (err as Error).message });
    }
  }

  broadcast('videos:batch-optimized', { workflowId: req.params.workflowId, results });
  res.json(results);
});

// Get upload metadata for Google Drive
router.get('/upload-meta/:workflowId', (req, res) => {
  const workflow = getWorkflow(req.params.workflowId);
  if (!workflow) {
    res.status(404).json({ error: 'Workflow not found' });
    return;
  }

  const images = getWorkflowImages(workflow.id).filter((i) => i.human_status === 'approved');
  const videos = getWorkflowVideos(workflow.id).filter((v) => v.optimized_path);

  const imageMeta = images.map((img) =>
    prepareUploadMetadata(workflow.task_name, img.file_path || '', 'image', undefined, img.iteration)
  );

  const videoMeta = videos.map((vid) =>
    prepareUploadMetadata(workflow.task_name, vid.optimized_path || '', 'video', vid.emotion, vid.iteration)
  );

  res.json({ images: imageMeta, videos: videoMeta });
});

// Serve asset files
router.get('/asset/:filename', (req, res) => {
  const filePath = join(assetsDir, req.params.filename);
  res.sendFile(filePath);
});

export default router;
