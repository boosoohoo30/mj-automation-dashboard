import { Router } from 'express';
import {
  getImage,
  updateImage,
  getVideo,
  updateVideo,
  addFeedback,
  getWorkflowVideos,
} from '../workflow/engine.js';
import { broadcast } from '../websocket/handler.js';

const router = Router();

// Review image (approve/reject)
router.post('/image/:id', (req, res) => {
  const { action, feedback } = req.body as { action: 'approve' | 'reject'; feedback?: string };
  const image = getImage(req.params.id);
  if (!image) {
    res.status(404).json({ error: 'Image not found' });
    return;
  }

  updateImage(image.id, {
    human_status: action === 'approve' ? 'approved' : 'rejected',
    human_feedback: feedback ?? null,
  });

  if (feedback) {
    addFeedback(image.workflow_id, 'image', image.id, feedback);
  }

  const updated = getImage(image.id);
  broadcast('image:reviewed', updated);
  res.json(updated);
});

// Review video (approve/reject)
router.post('/video/:id', (req, res) => {
  const { action, feedback } = req.body as { action: 'approve' | 'reject'; feedback?: string };
  const video = getVideo(req.params.id);
  if (!video) {
    res.status(404).json({ error: 'Video not found' });
    return;
  }

  updateVideo(video.id, {
    human_status: action === 'approve' ? 'approved' : 'rejected',
    human_feedback: feedback ?? null,
  });

  if (feedback) {
    addFeedback(video.workflow_id, 'video', video.id, feedback);
  }

  const updated = getVideo(video.id);
  broadcast('video:reviewed', updated);
  res.json(updated);
});

// Batch review all videos for a workflow
router.post('/videos/batch/:workflowId', (req, res) => {
  const { action, feedback } = req.body as { action: 'approve' | 'reject'; feedback?: string };
  const videos = getWorkflowVideos(req.params.workflowId);

  for (const video of videos) {
    if (video.human_status === 'pending') {
      updateVideo(video.id, {
        human_status: action === 'approve' ? 'approved' : 'rejected',
        human_feedback: feedback ?? null,
      });
    }
  }

  const updated = getWorkflowVideos(req.params.workflowId);
  broadcast('videos:batch-reviewed', { workflowId: req.params.workflowId, videos: updated });
  res.json(updated);
});

export default router;
