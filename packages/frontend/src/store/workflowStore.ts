import { create } from 'zustand';
import type { Workflow, Image, Video } from '../types/workflow';

const API = '/api';

interface WorkflowState {
  workflows: Workflow[];
  activeWorkflow: Workflow | null;
  loading: boolean;
  error: string | null;

  fetchWorkflows: () => Promise<void>;
  fetchWorkflow: (id: string) => Promise<void>;
  createWorkflow: (taskName: string) => Promise<Workflow>;
  updateStatus: (id: string, status: string) => Promise<void>;
  reviewImage: (imageId: string, action: 'approve' | 'reject', feedback?: string) => Promise<void>;
  reviewVideo: (videoId: string, action: 'approve' | 'reject', feedback?: string) => Promise<void>;
  batchReviewVideos: (workflowId: string, action: 'approve' | 'reject', feedback?: string) => Promise<void>;
  uploadImage: (workflowId: string, file: File, prompt?: string) => Promise<void>;

  // WebSocket-driven updates
  handleWsEvent: (event: string, data: unknown) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: [],
  activeWorkflow: null,
  loading: false,
  error: null,

  fetchWorkflows: async () => {
    set({ loading: true });
    try {
      const res = await fetch(`${API}/workflows`);
      const workflows = await res.json();
      set({ workflows, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  fetchWorkflow: async (id: string) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API}/workflows/${id}`);
      const workflow = await res.json();
      set({ activeWorkflow: workflow, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createWorkflow: async (taskName: string) => {
    const res = await fetch(`${API}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_name: taskName }),
    });
    const workflow = await res.json();
    set((s) => ({ workflows: [workflow, ...s.workflows] }));
    return workflow;
  },

  updateStatus: async (id: string, status: string) => {
    await fetch(`${API}/workflows/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await get().fetchWorkflow(id);
  },

  reviewImage: async (imageId: string, action, feedback) => {
    await fetch(`${API}/review/image/${imageId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, feedback }),
    });
    const active = get().activeWorkflow;
    if (active) await get().fetchWorkflow(active.id);
  },

  reviewVideo: async (videoId: string, action, feedback) => {
    await fetch(`${API}/review/video/${videoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, feedback }),
    });
    const active = get().activeWorkflow;
    if (active) await get().fetchWorkflow(active.id);
  },

  batchReviewVideos: async (workflowId, action, feedback) => {
    await fetch(`${API}/review/videos/batch/${workflowId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, feedback }),
    });
    await get().fetchWorkflow(workflowId);
  },

  uploadImage: async (workflowId: string, file: File, prompt?: string) => {
    const formData = new FormData();
    formData.append('image', file);
    if (prompt) formData.append('prompt', prompt);

    await fetch(`${API}/generation/image/upload/${workflowId}`, {
      method: 'POST',
      body: formData,
    });
    await get().fetchWorkflow(workflowId);
  },

  handleWsEvent: (event: string, data: unknown) => {
    const active = get().activeWorkflow;
    if (!active) return;

    if (event === 'workflow:status-change') {
      const updated = data as Workflow;
      if (updated.id === active.id) {
        set((s) => ({
          activeWorkflow: { ...active, ...updated, images: active.images, videos: active.videos },
        }));
      }
    }

    if (event === 'image:reviewed' || event === 'image:uploaded') {
      const img = data as Image;
      if (img.workflow_id === active.id) {
        get().fetchWorkflow(active.id);
      }
    }

    if (event.startsWith('video:') || event.startsWith('videos:')) {
      get().fetchWorkflow(active.id);
    }
  },
}));
