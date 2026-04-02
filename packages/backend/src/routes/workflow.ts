import { Router } from 'express';
import {
  createWorkflow,
  getWorkflow,
  listWorkflows,
  updateWorkflowStatus,
  getWorkflowImages,
  getWorkflowVideos,
  getFeedbackLog,
  type WorkflowStatus,
} from '../workflow/engine.js';
import { broadcast } from '../websocket/handler.js';

const router = Router();

// List all workflows
router.get('/', (_req, res) => {
  const workflows = listWorkflows();
  res.json(workflows);
});

// Create new workflow
router.post('/', (req, res) => {
  const { task_name, slack_channel, slack_ts } = req.body;
  if (!task_name) {
    res.status(400).json({ error: 'task_name is required' });
    return;
  }
  const workflow = createWorkflow(task_name, slack_channel, slack_ts);
  broadcast('workflow:created', workflow);
  res.status(201).json(workflow);
});

// Get single workflow with all related data
router.get('/:id', (req, res) => {
  const workflow = getWorkflow(req.params.id);
  if (!workflow) {
    res.status(404).json({ error: 'Workflow not found' });
    return;
  }
  const images = getWorkflowImages(workflow.id);
  const videos = getWorkflowVideos(workflow.id);
  const feedback = getFeedbackLog(workflow.id);
  res.json({ ...workflow, images, videos, feedback });
});

// Update workflow status
router.patch('/:id/status', (req, res) => {
  const { status } = req.body as { status: WorkflowStatus };
  const workflow = getWorkflow(req.params.id);
  if (!workflow) {
    res.status(404).json({ error: 'Workflow not found' });
    return;
  }
  updateWorkflowStatus(workflow.id, status);
  const updated = getWorkflow(workflow.id);
  broadcast('workflow:status-change', updated);
  res.json(updated);
});

export default router;
