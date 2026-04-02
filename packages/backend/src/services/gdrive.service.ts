import { readFileSync } from 'fs';
import { basename } from 'path';

// Google Drive upload via Google Drive API v3
// For now, this uses a service account or OAuth token
// The actual auth will be handled via the existing Google Drive MCP connection

const GDRIVE_FOLDER = process.env.GOOGLE_DRIVE_FOLDER || '';

export interface UploadResult {
  fileId: string;
  webViewLink: string;
  name: string;
}

// Format task name for file naming
function sanitizeName(name: string): string {
  return name.replace(/[^\w가-힣_-]/g, '_').replace(/_+/g, '_');
}

// Generate organized filename
export function generateFileName(
  taskName: string,
  type: 'image' | 'video',
  emotion?: string,
  version = 1
): string {
  const sanitized = sanitizeName(taskName);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  if (type === 'image') {
    return `${sanitized}_concept_v${version}.png`;
  }
  return `${sanitized}_${emotion || 'natural'}_v${version}.mp4`;
}

// Generate folder name
export function generateFolderName(taskName: string): string {
  const sanitized = sanitizeName(taskName);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${sanitized}_${date}`;
}

// Note: Actual file upload will be done through the Google Drive MCP tools
// or via Google Drive API with proper OAuth.
// This module provides naming and organization utilities.
// The upload integration is triggered from the API routes.

export function prepareUploadMetadata(
  taskName: string,
  filePath: string,
  type: 'image' | 'video',
  emotion?: string,
  version = 1
): { name: string; folderName: string; mimeType: string } {
  const name = generateFileName(taskName, type, emotion, version);
  const folderName = generateFolderName(taskName);
  const mimeType = type === 'image' ? 'image/png' : 'video/mp4';
  return { name, folderName, mimeType };
}
